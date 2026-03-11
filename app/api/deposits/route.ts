import { NextRequest, NextResponse } from 'next/server';
import {
  releaseDepositHold,
  captureDeposit,
  chargeForDamage,
} from '@/lib/stripe-deposits';
import { getItem, updateItem } from '@/lib/dynamodb';

/**
 * Deposit management API.
 * Used by admin to release holds or capture for damage.
 *
 * POST /api/deposits
 * Body: { action: 'release' | 'capture' | 'charge', bookingId, amount? }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, bookingId, amount, description } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'bookingId is required' },
        { status: 400 },
      );
    }

    // Get booking record
    const booking = await getItem(`BOOKING#${bookingId}`, 'META');
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 },
      );
    }

    const now = new Date().toISOString();

    switch (action) {
      case 'release': {
        // Release the deposit hold — equipment returned satisfactorily
        const paymentIntentId = booking.depositPaymentIntentId as string;
        if (!paymentIntentId) {
          return NextResponse.json(
            { error: 'No deposit hold found for this booking' },
            { status: 400 },
          );
        }

        await releaseDepositHold(paymentIntentId);
        await updateItem(`BOOKING#${bookingId}`, 'META', {
          depositStatus: 'released',
          depositReleasedAt: now,
          updatedAt: now,
        });

        return NextResponse.json({ status: 'released' });
      }

      case 'capture': {
        // Capture deposit — damage found during inspection
        const paymentIntentId = booking.depositPaymentIntentId as string;
        if (!paymentIntentId) {
          return NextResponse.json(
            { error: 'No deposit hold found for this booking' },
            { status: 400 },
          );
        }

        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'amount is required for capture' },
            { status: 400 },
          );
        }

        const captured = await captureDeposit(paymentIntentId, amount);
        await updateItem(`BOOKING#${bookingId}`, 'META', {
          depositStatus: 'captured',
          depositCapturedAmount: amount,
          depositCapturedAt: now,
          updatedAt: now,
        });

        return NextResponse.json({
          status: 'captured',
          amount: captured.amount_received,
        });
      }

      case 'charge': {
        // Charge saved card — for post-return damage on long rentals
        const customerId = booking.stripeCustomerId as string;
        if (!customerId) {
          return NextResponse.json(
            { error: 'No Stripe customer ID for this booking' },
            { status: 400 },
          );
        }

        if (!amount || amount <= 0) {
          return NextResponse.json(
            { error: 'amount is required for charge' },
            { status: 400 },
          );
        }

        const charge = await chargeForDamage({
          customerId,
          amount,
          bookingId,
          description: description || `Damage charge — Booking ${bookingId}`,
        });

        await updateItem(`BOOKING#${bookingId}`, 'META', {
          damageChargeAmount: amount,
          damageChargeIntentId: charge.id,
          damageChargedAt: now,
          updatedAt: now,
        });

        return NextResponse.json({
          status: 'charged',
          amount: charge.amount,
          paymentIntentId: charge.id,
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: release, capture, or charge' },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error('Deposit API error:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Deposit operation failed',
      },
      { status: 500 },
    );
  }
}
