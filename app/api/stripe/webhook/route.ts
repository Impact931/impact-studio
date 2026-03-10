import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateItem, getItem } from '@/lib/dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;
const REGION = process.env.AWS_REGION || 'us-east-1';
const OPS_EMAIL = 'angus@jhr-photography.com';
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'info@jhr-photography.com';

const sesConfig: ConstructorParameters<typeof SESClient>[0] = { region: REGION };
if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  sesConfig.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}
const ses = new SESClient(sesConfig);

async function sendEmail(to: string, subject: string, body: string) {
  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject },
        Body: {
          Html: { Data: body },
        },
      },
    }),
  );
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 },
      );
    }

    let event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 },
      );
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as { metadata?: { bookingId?: string }; customer_email?: string | null };
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        console.error('No bookingId in session metadata');
        return NextResponse.json({ received: true });
      }

      // Update booking status
      const now = new Date().toISOString();
      await updateItem(`BOOKING#${bookingId}`, 'META', {
        status: 'confirmed',
        updatedAt: now,
      });

      // Fetch booking for email details
      const booking = await getItem(`BOOKING#${bookingId}`, 'META');

      if (booking) {
        const renterEmail = booking.email as string;
        const renterName = booking.renterName as string;
        const rentalDate = booking.rentalDate as string;
        const startTime = booking.startTime as string;
        const endTime = booking.endTime as string;

        // Send confirmation to renter
        await sendEmail(
          renterEmail,
          'Impact Studio — Booking Confirmed',
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #c8a96e;">Booking Confirmed</h1>
            <p>Hi ${renterName},</p>
            <p>Your Impact Studio booking has been confirmed. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px;">${rentalDate}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px;">${startTime} – ${endTime}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Reference</td><td style="padding: 8px; font-family: monospace;">${bookingId}</td></tr>
            </table>
            <p><strong>Studio Address:</strong><br/>2300 Rotary Park Dr, Suite A<br/>Clarksville, TN 37043</p>
            <p>Our operations manager will follow up with any additional details. If you have questions, reply to this email or call 615-249-8096.</p>
            <p style="color: #c8a96e; font-weight: bold;">— Impact Studio by JHR Photography</p>
          </div>
          `,
        );

        // Send ops notification
        await sendEmail(
          OPS_EMAIL,
          `New Booking: ${renterName} — ${rentalDate}`,
          `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h1 style="color: #c8a96e;">New Studio Booking</h1>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; color: #666;">Booking ID</td><td style="padding: 8px; font-family: monospace;">${bookingId}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Renter</td><td style="padding: 8px;">${renterName}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Company</td><td style="padding: 8px;">${booking.company || '—'}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px;">${renterEmail}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Phone</td><td style="padding: 8px;">${booking.phone || '—'}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px;">${rentalDate}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px;">${startTime} – ${endTime}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Production</td><td style="padding: 8px;">${booking.productionType || '—'}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Insurance</td><td style="padding: 8px;">${booking.hasInsurance ? booking.insuranceProvider : 'No — $500 hold'}</td></tr>
              <tr><td style="padding: 8px; color: #666;">Total</td><td style="padding: 8px;">$${((booking.totalAmount as number) / 100).toFixed(2)}</td></tr>
            </table>
            <p>Review this booking in the admin panel or DynamoDB.</p>
          </div>
          `,
        );
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 },
    );
  }
}
