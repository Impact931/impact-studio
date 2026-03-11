import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Booking } from '@/types/booking';
import { formatPrice } from '@/content/equipment-catalog';

const REGION = process.env.AWS_REGION || 'us-east-1';
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'noreply@jhr-photography.com';
const OPS_EMAIL =
  process.env.OPS_NOTIFICATION_EMAIL || 'angus@jhr-photography.com';

const sesConfig: ConstructorParameters<typeof SESClient>[0] = {
  region: REGION,
};

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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function equipmentRows(booking: Booking): string {
  return booking.equipment
    .map(
      (item) =>
        `<tr>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join('\n');
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Confirmation email to the renter
// ---------------------------------------------------------------------------

export async function sendBookingConfirmation(booking: Booking) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;">
  <h2 style="color:#1a1a1a;">Impact Studio — Booking Confirmation</h2>
  <p>Hi ${booking.renterName},</p>
  <p>Thank you for booking the Impact Studio! Here's a summary of your reservation.</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <tr><td style="padding:4px 0;font-weight:bold;">Date</td><td>${formatDate(booking.rentalDate)}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Time</td><td>${booking.startTime} – ${booking.endTime}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Rental Mode</td><td>${booking.rentalMode === 'in_studio' ? 'In-Studio' : 'Out of Studio'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Booking ID</td><td>${booking.bookingId}</td></tr>
  </table>

  <h3 style="margin-top:24px;">Equipment</h3>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;text-align:left;">Item</th>
        <th style="padding:8px 12px;text-align:center;">Qty</th>
        <th style="padding:8px 12px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${equipmentRows(booking)}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:8px 12px;font-weight:bold;">Total</td>
        <td style="padding:8px 12px;text-align:right;font-weight:bold;">${formatPrice(booking.totalAmount)}</td>
      </tr>
    </tfoot>
  </table>

  <h3 style="margin-top:24px;">Next Steps</h3>
  <ol>
    <li>You will receive a calendar invite with the studio address and access details.</li>
    <li>If you have not already, please provide a Certificate of Insurance (COI) with at least $1M coverage.</li>
    <li>Arrive on time — overtime is billed at 1.5x the hourly rate.</li>
  </ol>

  <p style="margin-top:24px;font-size:13px;color:#777;">
    Questions? Reply to this email or contact us at info@jhr-photography.com | 615-249-8096
  </p>
</body>
</html>`;

  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
      Destination: { ToAddresses: [booking.email] },
      Message: {
        Subject: { Data: `Impact Studio Booking Confirmed — ${formatDate(booking.rentalDate)}` },
        Body: { Html: { Data: html } },
      },
    }),
  );
}

// ---------------------------------------------------------------------------
// Ops notification email
// ---------------------------------------------------------------------------

export async function sendOpsNotification(booking: Booking) {
  const flags: string[] = [];
  if (!booking.hasInsurance) flags.push('NO INSURANCE ON FILE');
  if (booking.securityHold) flags.push('Security hold authorized');
  if (booking.offSiteEquipment) flags.push('Off-site equipment rental');
  if (booking.specialRequirements.length > 0) flags.push('Has special requirements');

  const flagsHtml = flags.length
    ? `<p style="color:#c0392b;font-weight:bold;">${flags.join(' | ')}</p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;color:#333;max-width:700px;margin:0 auto;">
  <h2 style="color:#1a1a1a;">New Impact Studio Booking</h2>
  ${flagsHtml}

  <h3>Renter</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 0;font-weight:bold;width:180px;">Name</td><td>${booking.renterName}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Company</td><td>${booking.company || '—'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Email</td><td>${booking.email}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Phone</td><td>${booking.phone}</td></tr>
  </table>

  <h3>Booking Details</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 0;font-weight:bold;width:180px;">Booking ID</td><td>${booking.bookingId}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Date</td><td>${formatDate(booking.rentalDate)}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Time</td><td>${booking.startTime} – ${booking.endTime}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Rental Type</td><td>${booking.studioRentalType}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Mode</td><td>${booking.rentalMode === 'in_studio' ? 'In-Studio' : 'Out of Studio'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Production</td><td>${booking.productionType}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Description</td><td>${booking.description || '—'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Est. People</td><td>${booking.estimatedPeople || '—'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Background</td><td>${booking.backgroundUsage ? booking.backgroundColor : 'None'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Damage Waiver</td><td>${booking.damageWaiver ? 'Yes' : 'No'}</td></tr>
  </table>

  <h3>Equipment</h3>
  <table style="width:100%;border-collapse:collapse;">
    <thead>
      <tr style="background:#f5f5f5;">
        <th style="padding:8px 12px;text-align:left;">Item</th>
        <th style="padding:8px 12px;text-align:center;">Qty</th>
        <th style="padding:8px 12px;text-align:right;">Subtotal</th>
      </tr>
    </thead>
    <tbody>
      ${equipmentRows(booking)}
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:8px 12px;font-weight:bold;">Total</td>
        <td style="padding:8px 12px;text-align:right;font-weight:bold;">${formatPrice(booking.totalAmount)}</td>
      </tr>
    </tfoot>
  </table>

  <h3>Insurance</h3>
  <p>${booking.hasInsurance ? `Provider: ${booking.insuranceProvider}` : '<strong style="color:#c0392b;">No insurance provided — follow up required</strong>'}</p>

  ${booking.specialRequirements.length > 0 ? `
  <h3>Special Requirements</h3>
  <ul>${booking.specialRequirements.map((r) => `<li>${r}</li>`).join('')}</ul>
  ` : ''}

  ${booking.contentDisclosure.length > 0 ? `
  <h3>Content Disclosures</h3>
  <ul>${booking.contentDisclosure.map((d) => `<li>${d}</li>`).join('')}</ul>
  ` : ''}

  <h3>Payment</h3>
  <table style="width:100%;border-collapse:collapse;">
    <tr><td style="padding:4px 0;font-weight:bold;width:180px;">Stripe Session</td><td>${booking.stripeSessionId || '—'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Security Hold</td><td>${booking.stripePaymentIntentId || 'None'}</td></tr>
    <tr><td style="padding:4px 0;font-weight:bold;">Status</td><td>${booking.status}</td></tr>
  </table>

  <p style="margin-top:24px;font-size:12px;color:#999;">Created: ${booking.createdAt}</p>
</body>
</html>`;

  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
      Destination: { ToAddresses: [OPS_EMAIL] },
      Message: {
        Subject: {
          Data: `[Impact Studio] New Booking — ${booking.renterName} — ${formatDate(booking.rentalDate)}`,
        },
        Body: { Html: { Data: html } },
      },
    }),
  );
}
