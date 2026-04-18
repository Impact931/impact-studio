# Booking Wizard

## Overview
Multi-step booking flow at `/book` for studio and equipment rentals.

## Flow
1. Select service type (studio/equipment)
2. Choose dates and times
3. Select equipment (syncs to persistent cart)
4. Customer details
5. Review and payment (Stripe)
6. Confirmation → triggers Notion Rentals sync

## Cart Integration
- Equipment selections sync to persistent cart (commit e2cc360)
- Cart seeds wizard on return visits (commit ab771a1)
- Cart is auth-gated, per-user persistence (commit 917077e)

## Digital Signatures
- Captured via HTML canvas
- Stored as PNG in S3 (impact-studio-assets bucket)

## Related
- [[stripe-payments]] — payment processing
- [[notion-sync]] — booking confirmation syncs to Rentals DB
- [[equipment-catalog]] — catalog data feeds wizard selections
- [[auth-system]] — cart requires authentication

## Sources
- Journal entries: 017, 018
- Recent commits: e2cc360, ab771a1, 917077e, b9623bb
