import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getItem, updateItem, queryItems } from '@/lib/dynamodb';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const REGION = process.env.AWS_REGION || 'us-east-1';
const FROM_EMAIL = process.env.SES_FROM_EMAIL || 'bookings@impactstudio931.com';
const OPS_EMAIL = process.env.OPS_NOTIFICATION_EMAIL || 'angus@jhr-photography.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@impactstudio931.com';

const sesConfig: ConstructorParameters<typeof SESClient>[0] = { region: REGION };
if (process.env.CUSTOM_AWS_ACCESS_KEY_ID && process.env.CUSTOM_AWS_SECRET_ACCESS_KEY) {
  sesConfig.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}
const ses = new SESClient(sesConfig);

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['checked_out', 'cancelled'],
  checked_out: ['returned', 'cancelled'],
  returned: ['completed'],
  completed: [],
  cancelled: [],
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_out: 'Checked Out',
  returned: 'Returned',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// GET /api/admin/rentals/[id] — fetch single rental with full details
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const booking = await getItem(`BOOKING#${id}`, 'META');
    if (!booking) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Fetch activity log entries
    const activities = await queryItems(`BOOKING#${id}`, 'ACTIVITY#');

    // Fetch notes
    const notes = await queryItems(`BOOKING#${id}`, 'NOTE#');

    return NextResponse.json({
      rental: {
        bookingId: id,
        renterName: booking.renterName,
        email: booking.email,
        phone: booking.phone,
        company: booking.company,
        rentalDate: booking.rentalDate,
        endDate: booking.endDate,
        startTime: booking.startTime,
        endTime: booking.endTime,
        rentalMode: booking.rentalMode,
        productionType: booking.productionType,
        description: booking.description,
        estimatedPeople: booking.estimatedPeople,
        equipment: booking.equipment || [],
        totalAmount: Number(booking.totalAmount) || 0,
        status: booking.status || 'pending',
        hasInsurance: booking.hasInsurance,
        insuranceProvider: booking.insuranceProvider,
        securityHold: booking.securityHold,
        damageWaiver: booking.damageWaiver,
        signatureImageKey: booking.signatureImageKey,
        stripeSessionId: booking.stripeSessionId || booking.stripeCheckoutSessionId,
        stripePaymentIntentId: booking.stripePaymentIntentId,
        stripeCustomerId: booking.stripeCustomerId,
        stripeAmountTotal: booking.stripeAmountTotal,
        depositPaymentIntentId: booking.depositPaymentIntentId,
        depositStatus: booking.depositStatus,
        specialRequirements: booking.specialRequirements || [],
        contentDisclosure: booking.contentDisclosure || [],
        createdAt: booking.createdAt,
        updatedAt: booking.updatedAt,
        checkedOutAt: booking.checkedOutAt,
        returnedAt: booking.returnedAt,
        completedAt: booking.completedAt,
        cancelledAt: booking.cancelledAt,
      },
      activities: activities.map((a) => ({
        id: a.SK,
        action: a.action,
        details: a.details,
        performedBy: a.performedBy,
        timestamp: a.timestamp,
      })),
      notes: notes.map((n) => ({
        id: n.SK,
        text: n.text,
        author: n.author,
        timestamp: n.timestamp,
      })),
    });
  } catch (err) {
    console.error('Admin rental detail error:', err);
    return NextResponse.json({ error: 'Failed to load rental' }, { status: 500 });
  }
}

// PATCH /api/admin/rentals/[id] — update status, add note
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, note } = body;

    const booking = await getItem(`BOOKING#${id}`, 'META');
    if (!booking) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const currentStatus = (booking.status as string) || 'pending';
    const performedBy = (session.user?.email as string) || 'admin';

    // Handle note addition
    if (note && !action) {
      const noteId = `NOTE#${now}`;
      await updateItem(`BOOKING#${id}`, noteId, {
        text: note,
        author: performedBy,
        timestamp: now,
      });
      return NextResponse.json({ success: true, noteId });
    }

    // Handle status change
    if (!action) {
      return NextResponse.json({ error: 'action is required' }, { status: 400 });
    }

    const validNext = VALID_TRANSITIONS[currentStatus] || [];
    if (!validNext.includes(action)) {
      return NextResponse.json(
        { error: `Cannot transition from "${currentStatus}" to "${action}". Valid: ${validNext.join(', ') || 'none'}` },
        { status: 400 },
      );
    }

    // Update booking status
    const updates: Record<string, unknown> = {
      status: action,
      updatedAt: now,
    };

    // Set timestamp for the specific status
    switch (action) {
      case 'confirmed': updates.confirmedAt = now; break;
      case 'checked_out': updates.checkedOutAt = now; break;
      case 'returned': updates.returnedAt = now; break;
      case 'completed': updates.completedAt = now; break;
      case 'cancelled': updates.cancelledAt = now; break;
    }

    await updateItem(`BOOKING#${id}`, 'META', updates);

    // Log activity
    const activityId = `ACTIVITY#${now}`;
    await updateItem(`BOOKING#${id}`, activityId, {
      action: `status_change`,
      details: `Status changed from ${STATUS_LABELS[currentStatus]} to ${STATUS_LABELS[action]}${note ? `: ${note}` : ''}`,
      performedBy,
      previousStatus: currentStatus,
      newStatus: action,
      timestamp: now,
    });

    // Send emails based on status change
    const renterEmail = booking.email as string;
    const renterName = booking.renterName as string;
    const rentalDate = booking.rentalDate as string;
    const formatUSD = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    const total = Number(booking.totalAmount) || 0;

    try {
      switch (action) {
        case 'confirmed':
          // Customer confirmation email
          await ses.send(new SendEmailCommand({
            Source: FROM_EMAIL,
            ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
            Destination: { ToAddresses: [renterEmail] },
            Message: {
              Subject: { Data: `Impact Studio — Your Rental is Confirmed! #${id.slice(0, 8)}` },
              Body: { Html: { Data: buildStatusEmail(renterName, 'confirmed', id, rentalDate, formatUSD(total), note) } },
            },
          }));
          break;

        case 'checked_out':
          // Customer checkout notification
          await ses.send(new SendEmailCommand({
            Source: FROM_EMAIL,
            ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
            Destination: { ToAddresses: [renterEmail] },
            Message: {
              Subject: { Data: `Impact Studio — Equipment Checked Out #${id.slice(0, 8)}` },
              Body: { Html: { Data: buildStatusEmail(renterName, 'checked_out', id, rentalDate, formatUSD(total), note) } },
            },
          }));
          break;

        case 'completed':
          // Customer completion/thank you
          await ses.send(new SendEmailCommand({
            Source: FROM_EMAIL,
            ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
            Destination: { ToAddresses: [renterEmail] },
            Message: {
              Subject: { Data: `Impact Studio — Rental Complete! Thank You #${id.slice(0, 8)}` },
              Body: { Html: { Data: buildStatusEmail(renterName, 'completed', id, rentalDate, formatUSD(total), note) } },
            },
          }));
          break;

        case 'cancelled':
          // Customer cancellation
          await ses.send(new SendEmailCommand({
            Source: FROM_EMAIL,
            ReplyToAddresses: ['jayson@jhr-photography.com', 'angus@jhr-photography.com'],
            Destination: { ToAddresses: [renterEmail] },
            Message: {
              Subject: { Data: `Impact Studio — Rental Cancelled #${id.slice(0, 8)}` },
              Body: { Html: { Data: buildStatusEmail(renterName, 'cancelled', id, rentalDate, formatUSD(total), note) } },
            },
          }));
          break;
      }

      // Admin notification for all status changes
      const adminRecipients = Array.from(new Set([OPS_EMAIL, ADMIN_EMAIL].filter(Boolean)));
      await ses.send(new SendEmailCommand({
        Source: FROM_EMAIL,
        ReplyToAddresses: ['jayson@jhr-photography.com'],
        Destination: { ToAddresses: adminRecipients },
        Message: {
          Subject: { Data: `[Impact Studio] ${STATUS_LABELS[action]}: ${renterName} — ${rentalDate} — ${formatUSD(total)}` },
          Body: { Html: { Data: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
              <h2 style="color:#c8a96e;">Rental Status Update</h2>
              <p><strong>${renterName}</strong> rental status changed to <strong>${STATUS_LABELS[action]}</strong>.</p>
              <table style="width:100%;border-collapse:collapse;font-size:14px;margin:16px 0;">
                <tr><td style="padding:4px 0;color:#666;width:120px;">Booking ID</td><td style="font-family:monospace;">${id}</td></tr>
                <tr><td style="padding:4px 0;color:#666;">Date</td><td>${rentalDate}</td></tr>
                <tr><td style="padding:4px 0;color:#666;">Total</td><td>${formatUSD(total)}</td></tr>
                <tr><td style="padding:4px 0;color:#666;">Updated By</td><td>${performedBy}</td></tr>
                ${note ? `<tr><td style="padding:4px 0;color:#666;">Note</td><td>${note}</td></tr>` : ''}
              </table>
            </div>
          ` } },
        },
      }));
    } catch (emailErr) {
      console.error('Status change email failed:', emailErr);
      // Don't fail the status update due to email error
    }

    return NextResponse.json({ success: true, status: action });
  } catch (err) {
    console.error('Admin rental update error:', err);
    return NextResponse.json({ error: 'Failed to update rental' }, { status: 500 });
  }
}

function buildStatusEmail(
  name: string,
  status: string,
  bookingId: string,
  date: string,
  total: string,
  note?: string,
): string {
  const messages: Record<string, { heading: string; body: string }> = {
    confirmed: {
      heading: 'Your Rental is Confirmed!',
      body: 'Your equipment rental has been confirmed. Our team will be in touch with pickup details.',
    },
    checked_out: {
      heading: 'Equipment Checked Out',
      body: 'Your equipment has been checked out. Please handle all items with care and return them on time and in the same condition.',
    },
    completed: {
      heading: 'Rental Complete — Thank You!',
      body: 'Your rental is complete and all equipment has been returned. Thank you for choosing Impact Studio! We hope to see you again.',
    },
    cancelled: {
      heading: 'Rental Cancelled',
      body: 'Your rental has been cancelled. If you have questions about this cancellation or would like to rebook, please contact us.',
    },
  };

  const msg = messages[status] || { heading: 'Status Update', body: 'Your rental status has been updated.' };

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333;">
    <div style="background:#1a1a1a;padding:24px;text-align:center;">
      <h1 style="color:#c8a96e;margin:0;font-size:24px;">Impact Studio</h1>
    </div>
    <div style="padding:24px;">
      <h2 style="color:#1a1a1a;">${msg.heading}</h2>
      <p>Hi ${name},</p>
      <p>${msg.body}</p>
      ${note ? `<p style="padding:12px;background:#f9f9f9;border-left:3px solid #c8a96e;margin:16px 0;"><em>${note}</em></p>` : ''}
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:20px 0;">
        <tr><td style="padding:6px 0;color:#666;width:120px;">Booking ID</td><td style="font-family:monospace;">${bookingId.slice(0, 8)}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Date</td><td>${date}</td></tr>
        <tr><td style="padding:6px 0;color:#666;">Total</td><td>${total}</td></tr>
      </table>
      <p style="font-size:13px;color:#666;">Questions? Reply to this email or call <strong>615-249-8096</strong>.</p>
      <p style="margin-top:24px;color:#c8a96e;font-weight:bold;">— Impact Studio by JHR Photography</p>
    </div>
  </div>`;
}
