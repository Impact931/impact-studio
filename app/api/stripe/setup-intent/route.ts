import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/stripe-deposits';

/**
 * Creates a SetupIntent for client-side card capture via Stripe Elements.
 * Card data goes directly to Stripe — never touches our servers (PCI compliant).
 *
 * POST /api/stripe/setup-intent
 * Body: { email, name, phone? }
 * Returns: { clientSecret, customerId }
 */
export async function POST(req: NextRequest) {
  try {
    const { email, name, phone } = await req.json();

    if (!email || !name) {
      return NextResponse.json(
        { error: 'email and name are required' },
        { status: 400 },
      );
    }

    // Get or create Stripe Customer
    const customerId = await getOrCreateStripeCustomer(email, name, phone);

    // Create SetupIntent for card capture
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      metadata: {
        purpose: 'card_on_file',
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
    });
  } catch (err) {
    console.error('SetupIntent error:', err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to create setup intent',
      },
      { status: 500 },
    );
  }
}
