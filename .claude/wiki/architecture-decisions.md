# Architecture Decisions

## Static Equipment Catalog
- **Decision:** Equipment data lives in `/content/equipment-catalog.ts` (static) with Notion as admin sync layer
- **Why:** Fast page loads, no API call needed for catalog browsing. Notion sync handles admin updates.

## Standalone Output Mode
- **Decision:** Next.js standalone output for Amplify deployment
- **Why:** Reduces bundle size, Amplify compatibility

## Manual Capture for Deposits
- **Decision:** Stripe PaymentIntent manual capture instead of immediate charge
- **Why:** Deposit hold pattern — authorize now, capture/release after rental completes

## Per-User Cart Persistence
- **Decision:** Cart is auth-gated and persists across logout
- **Why:** Users return to complete bookings; losing cart state = lost revenue
