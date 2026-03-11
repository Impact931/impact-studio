import Stripe from 'stripe';
import { stripe } from './stripe';

/**
 * Deposit hold thresholds based on PRD v2 Section 8.
 *
 * - Insured renter (COI on file): No deposit hold, rental fee captured immediately
 * - Uninsured, replacement < $15,000: Full replacement value hold
 * - Uninsured, replacement >= $15,000: Insurance required, cannot proceed
 *
 * Card data never touches our servers — Stripe handles PCI compliance.
 * We store only Stripe Customer IDs and PaymentIntent IDs in DynamoDB.
 */

const MAX_HOLD_AMOUNT = 1500000; // $15,000 in cents

export interface DepositHoldResult {
  customerId: string;
  paymentIntentId: string | null;
  setupIntentId: string | null;
  holdAmount: number;
  requiresInsurance: boolean;
}

/**
 * Get or create a Stripe Customer for the renter.
 * Reuses existing customer by email lookup.
 */
export async function getOrCreateStripeCustomer(
  email: string,
  name: string,
  phone?: string,
  metadata?: Record<string, string>,
): Promise<string> {
  // Check for existing customer by email
  const existing = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existing.data.length > 0) {
    return existing.data[0].id;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    phone: phone || undefined,
    metadata: metadata || {},
  });

  return customer.id;
}

/**
 * Create a deposit hold (PaymentIntent with manual capture).
 * The hold authorizes but does not charge the card.
 *
 * For rentals > 7 days, we also create a SetupIntent to save the
 * payment method for post-return charges if needed.
 */
export async function createDepositHold(params: {
  customerId: string;
  paymentMethodId: string;
  replacementValue: number; // cents
  bookingId: string;
  rentalDays: number;
}): Promise<DepositHoldResult> {
  const { customerId, paymentMethodId, replacementValue, bookingId, rentalDays } = params;

  // Insurance required for high-value rentals
  if (replacementValue > MAX_HOLD_AMOUNT) {
    return {
      customerId,
      paymentIntentId: null,
      setupIntentId: null,
      holdAmount: 0,
      requiresInsurance: true,
    };
  }

  // Create PaymentIntent with manual capture for deposit hold
  const paymentIntent = await stripe.paymentIntents.create({
    amount: replacementValue,
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    capture_method: 'manual',
    confirm: true,
    // Request extended authorization for longer holds (up to 30 days)
    payment_method_options: {
      card: {
        request_extended_authorization: 'if_available',
      },
    },
    metadata: {
      bookingId,
      purpose: 'security_deposit',
      replacementValue: String(replacementValue),
    },
    description: `Impact Studio security deposit — Booking ${bookingId}`,
  });

  // For rentals > 7 days, also save the card via SetupIntent
  // This allows charging for damage after the hold expires
  let setupIntentId: string | null = null;
  if (rentalDays > 7) {
    // Attach the payment method to the customer for future use
    await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    // Set as default payment method
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // Create a SetupIntent to confirm the card is stored
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method: paymentMethodId,
      confirm: true,
      usage: 'off_session',
      metadata: {
        bookingId,
        purpose: 'damage_fallback',
      },
    });

    setupIntentId = setupIntent.id;
  }

  return {
    customerId,
    paymentIntentId: paymentIntent.id,
    setupIntentId,
    holdAmount: replacementValue,
    requiresInsurance: false,
  };
}

/**
 * Release a deposit hold (cancel the uncaptured PaymentIntent).
 * Called when equipment is returned in satisfactory condition.
 */
export async function releaseDepositHold(paymentIntentId: string): Promise<void> {
  await stripe.paymentIntents.cancel(paymentIntentId);
}

/**
 * Capture a deposit hold (charge for damage/loss).
 * Can capture partial amount for repairs or full amount for replacement.
 */
export async function captureDeposit(
  paymentIntentId: string,
  amountToCapture: number, // cents — partial or full
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.capture(paymentIntentId, {
    amount_to_capture: amountToCapture,
  });
}

/**
 * Charge a customer's saved card for post-return damage.
 * Used when the original hold has expired (rentals > 7 days).
 */
export async function chargeForDamage(params: {
  customerId: string;
  amount: number; // cents
  bookingId: string;
  description: string;
}): Promise<Stripe.PaymentIntent> {
  const { customerId, amount, bookingId, description } = params;

  // Get the customer's default payment method
  const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
  const paymentMethodId = customer.invoice_settings?.default_payment_method as string;

  if (!paymentMethodId) {
    throw new Error('No payment method on file for this customer');
  }

  // Create and confirm a new PaymentIntent for the damage charge
  return stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    customer: customerId,
    payment_method: paymentMethodId,
    confirm: true,
    off_session: true,
    metadata: {
      bookingId,
      purpose: 'damage_charge',
    },
    description,
  });
}
