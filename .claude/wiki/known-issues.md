# Known Issues

> Last reviewed: 2026-04-18

## Active Issues
- **Stripe webhook may not be firing** — Hannah Walker's rentals show "pending" despite payment processing. SentLast24Hours=0 in SES confirms no emails sent. Webhook secret or endpoint URL may be misconfigured in Stripe dashboard. Check Stripe webhook logs.
- **lib/email.ts functions unused** — `sendBookingConfirmation()` and `sendOpsNotification()` in lib/email.ts are never called. The webhook has its own inline email code. Consider consolidating.

## Tech Debt
- Duplicate email code between webhook (inline SES) and lib/email.ts
- Old `formatPrice` helper in equipment-catalog.ts vs inline `formatUSD` in webhook

## Resolved (recent)
- Price display fixed in admin rentals — was showing cents as dollars (2026-04-18)
- Webhook email recipients now use env vars + admin@impactstudio931.com (2026-04-18)
- Email errors now non-blocking in webhook (won't fail the webhook) (2026-04-18)
- Webhook refactored to handle single-record Notion button push (621050d)
- Cart persistence across logout (ab771a1)
- Equipment selections sync to cart (e2cc360)
