import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { updateItem, getItem } from '@/lib/dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { createNotionRental, updateNotionClientRentalStats, updateNotionClientStripe } from '@/lib/notion-crm';

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
      ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
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
      const session = event.data.object as {
        id: string;
        metadata?: { bookingId?: string };
        customer_email?: string | null;
        customer?: string | null;
        payment_intent?: string | null;
        amount_total?: number | null;
        payment_status?: string;
        currency?: string;
      };
      const bookingId = session.metadata?.bookingId;

      if (!bookingId) {
        console.error('No bookingId in session metadata');
        return NextResponse.json({ received: true });
      }

      // Update booking status with full Stripe transaction details
      const now = new Date().toISOString();
      const stripeDetails: Record<string, unknown> = {
        status: 'confirmed',
        updatedAt: now,
        stripeCheckoutSessionId: session.id,
      };
      if (session.payment_intent) stripeDetails.stripePaymentIntentId = session.payment_intent;
      if (session.customer) stripeDetails.stripeCustomerId = session.customer;
      if (session.amount_total) stripeDetails.stripeAmountTotal = session.amount_total;
      if (session.payment_status) stripeDetails.stripePaymentStatus = session.payment_status;
      if (session.currency) stripeDetails.stripeCurrency = session.currency;

      await updateItem(`BOOKING#${bookingId}`, 'META', stripeDetails);

      // Fetch booking for email details
      const booking = await getItem(`BOOKING#${bookingId}`, 'META');

      if (booking) {
        const renterEmail = booking.email as string;
        const renterName = booking.renterName as string;
        const rentalDate = booking.rentalDate as string;
        const endDate = (booking.endDate as string) || rentalDate;
        const startTime = booking.startTime as string;
        const endTime = booking.endTime as string;
        const isMultiDay = endDate !== rentalDate;
        const totalAmount = booking.totalAmount as number;
        const equipment = (booking.equipment || []) as Array<{ name: string; quantity: number; price: number }>;

        const formatUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`;

        const equipmentRows = equipment
          .map(
            (item) =>
              `<tr>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.name}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
                <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">${formatUSD(item.price * item.quantity)}</td>
              </tr>`,
          )
          .join('\n');

        const securityHoldNote = !booking.hasInsurance
          ? `<p style="margin-top:12px;padding:10px;background:#fff8e6;border:1px solid #e6d5a0;border-radius:4px;font-size:13px;">
              <strong>Security Hold:</strong> A $500.00 authorization hold has been placed on your card. This is <em>not</em> a charge and will be released within 5 business days after equipment is returned in satisfactory condition.
            </p>`
          : '';

        // Send confirmation/receipt to renter
        await sendEmail(
          renterEmail,
          `Impact Studio — Receipt & Booking Confirmation #${bookingId.slice(0, 8)}`,
          `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
            <div style="background:#1a1a1a;padding:24px;text-align:center;">
              <h1 style="color:#c8a96e;margin:0;font-size:24px;">Impact Studio</h1>
              <p style="color:#999;margin:4px 0 0;font-size:13px;">Equipment Rental Receipt</p>
            </div>

            <div style="padding:24px;">
              <p>Hi ${renterName},</p>
              <p>Thank you for your rental! Your payment has been processed and your booking is confirmed. Here is your receipt.</p>

              <table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:14px;">
                <tr><td style="padding:6px 0;color:#666;width:140px;">Booking ID</td><td style="padding:6px 0;font-family:monospace;">${bookingId}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">Start</td><td style="padding:6px 0;">${rentalDate} at ${startTime}</td></tr>
                <tr><td style="padding:6px 0;color:#666;">End</td><td style="padding:6px 0;">${endDate} at ${endTime}</td></tr>
                ${isMultiDay ? `<tr><td style="padding:6px 0;color:#666;">Duration</td><td style="padding:6px 0;">${Math.ceil((new Date(endDate).getTime() - new Date(rentalDate).getTime()) / 86400000) + 1} day(s)</td></tr>` : ''}
                ${booking.company ? `<tr><td style="padding:6px 0;color:#666;">Company</td><td style="padding:6px 0;">${booking.company}</td></tr>` : ''}
                <tr><td style="padding:6px 0;color:#666;">Insurance</td><td style="padding:6px 0;">${booking.hasInsurance ? booking.insuranceProvider : 'None on file'}</td></tr>
              </table>

              <h3 style="margin:24px 0 8px;font-size:15px;color:#1a1a1a;">Equipment Rented</h3>
              <table style="width:100%;border-collapse:collapse;font-size:14px;">
                <thead>
                  <tr style="background:#f5f5f5;">
                    <th style="padding:8px 12px;text-align:left;font-weight:600;">Item</th>
                    <th style="padding:8px 12px;text-align:center;font-weight:600;">Qty</th>
                    <th style="padding:8px 12px;text-align:right;font-weight:600;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${equipmentRows}
                </tbody>
              </table>

              <div style="margin-top:12px;padding:12px;background:#f9f9f9;border-radius:4px;display:flex;justify-content:space-between;">
                <span style="font-size:16px;font-weight:700;">Total Paid</span>
                <span style="font-size:16px;font-weight:700;color:#c8a96e;">${formatUSD(totalAmount)}</span>
              </div>

              ${securityHoldNote}

              <hr style="margin:24px 0;border:none;border-top:1px solid #eee;" />

              <p style="font-size:13px;color:#666;"><strong>Pickup Location:</strong><br/>2300 Rotary Park Dr, Suite A<br/>Clarksville, TN 37043</p>

              <p style="font-size:13px;color:#666;">Our operations manager will follow up with pickup details. If you have questions, reply to this email or call <strong>615-249-8096</strong>.</p>

              <p style="margin-top:24px;color:#c8a96e;font-weight:bold;">— Impact Studio by JHR Photography</p>
            </div>
          </div>
          `,
        );

        // Send ops notification
        await sendEmail(
          OPS_EMAIL,
          `New Booking: ${renterName} — ${rentalDate} — ${formatUSD(totalAmount)}`,
          `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
            <h1 style="color:#c8a96e;">New Equipment Rental</h1>
            <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
              <tr><td style="padding:6px 0;color:#666;width:140px;">Booking ID</td><td style="padding:6px 0;font-family:monospace;">${bookingId}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Renter</td><td style="padding:6px 0;">${renterName}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Company</td><td style="padding:6px 0;">${booking.company || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Email</td><td style="padding:6px 0;">${renterEmail}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Phone</td><td style="padding:6px 0;">${booking.phone || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Start</td><td style="padding:6px 0;">${rentalDate} at ${startTime}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">End</td><td style="padding:6px 0;">${endDate} at ${endTime}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Production</td><td style="padding:6px 0;">${booking.productionType || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#666;">Insurance</td><td style="padding:6px 0;">${booking.hasInsurance ? booking.insuranceProvider : '<strong style="color:#c0392b;">No — $500 hold</strong>'}</td></tr>
            </table>

            <h3 style="margin:20px 0 8px;font-size:15px;">Equipment</h3>
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background:#f5f5f5;">
                  <th style="padding:8px 12px;text-align:left;">Item</th>
                  <th style="padding:8px 12px;text-align:center;">Qty</th>
                  <th style="padding:8px 12px;text-align:right;">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${equipmentRows}
              </tbody>
            </table>

            <div style="margin-top:12px;padding:12px;background:#f0f7f0;border-radius:4px;">
              <strong>Total Paid: ${formatUSD(totalAmount)}</strong>
            </div>
          </div>
          `,
        );

        // Sync to Notion CRM (non-blocking)
        const rentalMode = (booking.rentalMode as string) || 'in_studio';
        createNotionRental({
          bookingId,
          renterName,
          email: renterEmail,
          phone: booking.phone as string,
          company: booking.company as string | undefined,
          rentalDate,
          endDate: (booking.endDate as string) || rentalDate,
          startTime,
          endTime,
          rentalMode: rentalMode as 'in_studio' | 'out_of_studio',
          productionType: booking.productionType as string | undefined,
          equipment,
          totalAmount,
          hasInsurance: booking.hasInsurance as boolean,
          insuranceProvider: booking.insuranceProvider as string | undefined,
          stripePaymentIntentId: (session.payment_intent as string) || (booking.stripePaymentIntentId as string | undefined),
          stripeCheckoutSessionId: session.id,
          createdAt: booking.createdAt as string,
        }).catch((err) => console.error('Notion rental sync error:', err));

        updateNotionClientRentalStats(renterEmail, totalAmount).catch((err) =>
          console.error('Notion client stats sync error:', err),
        );

        // Store purchase history on the customer record
        if (booking.customerId) {
          const purchaseRecord = {
            bookingId,
            rentalDate,
            endDate,
            equipment: equipment.map((e) => ({ name: e.name, quantity: e.quantity, price: e.price })),
            totalAmount,
            stripeCheckoutSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || undefined,
            stripeCustomerId: session.customer || undefined,
            stripePaymentStatus: session.payment_status || undefined,
            purchasedAt: now,
          };
          updateItem(
            `CUSTOMER#${booking.customerId}`,
            `PURCHASE#${bookingId}`,
            purchaseRecord,
          ).catch((err) => console.error('Customer purchase history error:', err));
        }

        // Sync Stripe Customer ID to client record
        if (booking.stripeCustomerId) {
          updateNotionClientStripe(
            renterEmail,
            booking.stripeCustomerId as string,
          ).catch((err) =>
            console.error('Notion Stripe sync error:', err),
          );
        }
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
