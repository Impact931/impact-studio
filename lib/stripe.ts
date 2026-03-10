import Stripe from 'stripe';
import { Booking, CartItem } from '@/types/booking';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const SECURITY_HOLD_AMOUNT = 50000; // $500.00 in cents

/**
 * Create a Checkout Session for the booking's cart items.
 *
 * Also creates a separate PaymentIntent with manual capture for the $500
 * security hold (authorized but not captured until needed).
 */
export async function createCheckoutSession(booking: Booking) {
  // --- Build line items from the equipment cart ---
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
    booking.equipment.map((item: CartItem) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: item.name },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }));

  // --- Create the Checkout Session for the rental total ---
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: booking.email,
    metadata: {
      bookingId: booking.bookingId,
    },
    line_items: lineItems,
    success_url: `${SITE_URL}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/book?cancelled=true`,
  });

  // --- Create a separate PaymentIntent for the security hold ---
  // capture_method: 'manual' authorizes the card but does not capture funds.
  let securityHoldIntent: Stripe.PaymentIntent | null = null;

  if (booking.securityHold) {
    securityHoldIntent = await stripe.paymentIntents.create({
      amount: SECURITY_HOLD_AMOUNT,
      currency: 'usd',
      capture_method: 'manual',
      metadata: {
        bookingId: booking.bookingId,
        purpose: 'security_hold',
      },
      description: `Impact Studio security hold — Booking ${booking.bookingId}`,
    });
  }

  return {
    sessionId: session.id,
    sessionUrl: session.url,
    securityHoldIntentId: securityHoldIntent?.id ?? null,
  };
}

export { stripe };
