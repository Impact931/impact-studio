import { NextRequest, NextResponse } from 'next/server';
import { getItem } from '@/lib/dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

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
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 },
      );
    }

    const booking = await getItem(`BOOKING#${bookingId}`, 'META');

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 },
      );
    }

    const renterEmail = booking.email as string;
    const renterName = booking.renterName as string;
    const rentalDate = booking.rentalDate as string;
    const startTime = booking.startTime as string;
    const endTime = booking.endTime as string;

    // Send confirmation to renter
    await sendEmail(
      renterEmail,
      'Impact Studio — Booking Confirmation',
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #c8a96e;">Booking Confirmation</h1>
        <p>Hi ${renterName},</p>
        <p>Here are the details for your Impact Studio booking:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px;">${rentalDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px;">${startTime} – ${endTime}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Reference</td><td style="padding: 8px; font-family: monospace;">${bookingId}</td></tr>
        </table>
        <p><strong>Studio Address:</strong><br/>2300 Rotary Park Dr, Suite A<br/>Clarksville, TN 37043</p>
        <p>If you have any questions, reply to this email or call 615-249-8096.</p>
        <p style="color: #c8a96e; font-weight: bold;">— Impact Studio by JHR Photography</p>
      </div>
      `,
    );

    // Send ops notification
    await sendEmail(
      OPS_EMAIL,
      `Booking Notification: ${renterName} — ${rentalDate}`,
      `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h1 style="color: #c8a96e;">Booking Notification</h1>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
          <tr><td style="padding: 8px; color: #666;">Booking ID</td><td style="padding: 8px; font-family: monospace;">${bookingId}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Renter</td><td style="padding: 8px;">${renterName}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Company</td><td style="padding: 8px;">${booking.company || '—'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Email</td><td style="padding: 8px;">${renterEmail}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Phone</td><td style="padding: 8px;">${booking.phone || '—'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Date</td><td style="padding: 8px;">${rentalDate}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Time</td><td style="padding: 8px;">${startTime} – ${endTime}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Status</td><td style="padding: 8px;">${booking.status || '—'}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Total</td><td style="padding: 8px;">$${((booking.totalAmount as number) / 100).toFixed(2)}</td></tr>
        </table>
      </div>
      `,
    );

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error('Notify error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'Failed to send notifications',
      },
      { status: 500 },
    );
  }
}
