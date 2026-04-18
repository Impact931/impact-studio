# Stripe Payments

## Integration Pattern
- **Checkout Sessions** for standard payments
- **PaymentIntent manual capture** for deposit holds
- **SetupIntent** for saving payment methods

## Key Flows
1. **Booking deposit:** Customer books → Stripe holds deposit via manual capture → Release or capture after rental
2. **Equipment rental:** Checkout Session with line items from cart

## Cart System
- Per-user persistent cart (survives logout)
- Booking wizard syncs selections to cart
- Cart seeds booking wizard on return visits

## Related
- [[booking-wizard]] — the booking flow that triggers payment
- [[aws-infrastructure]] — Stripe keys stored in Amplify branch env vars
- [[auth-system]] — per-user cart persistence requires auth

## Sources
- Journal entries: 017, 018, 026
- Recent commits: e2cc360, ab771a1, 917077e
