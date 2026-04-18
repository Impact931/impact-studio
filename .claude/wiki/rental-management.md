# Rental Management (POS System)

## Status Workflow
```
pending → confirmed → checked_out → returned → completed
    ↓         ↓           ↓
  cancelled  cancelled   cancelled
```

## Admin Pages
- **Rentals list** (`/admin/rentals`) — filterable table with status counts, clickable rows
- **Rental detail** (`/admin/rentals/[id]`) — full POS management view

## Detail Page Features
- Customer info (name, email, phone, company)
- Rental details (dates, times, mode, production type, special requirements)
- Equipment table with per-item pricing and totals
- Status action buttons (contextual based on current status)
- Payment info (Stripe session, payment intent, amounts)
- Insurance & deposit management (release hold, capture for damage)
- Notes system (add notes, stored as separate DynamoDB records)
- Activity timeline (status changes logged with performer and timestamp)
- Timeline sidebar (created, confirmed, checked out, returned, completed timestamps)

## API Routes
- `GET /api/admin/rentals` — list all rentals
- `GET /api/admin/rentals/[id]` — single rental with activities and notes
- `PATCH /api/admin/rentals/[id]` — status change or add note
- `POST /api/deposits` — release/capture/charge deposit holds

## Email Notifications
Status changes trigger emails:
- **Customer receives**: confirmation, checkout notice, completion thank-you, cancellation
- **Admin + Ops receive**: all status changes with details
- From: bookings@impactstudio931.com
- To admin: admin@impactstudio931.com
- To ops: angus@jhr-photography.com (OPS_NOTIFICATION_EMAIL env var)

## DynamoDB Schema
```
BOOKING#{id} / META           — main booking record
BOOKING#{id} / ACTIVITY#{ts}  — status change log entries
BOOKING#{id} / NOTE#{ts}      — admin notes
CUSTOMER#{id} / PURCHASE#{id} — purchase history
```

## Valid Status Transitions
| From | To |
|------|-----|
| pending | confirmed, cancelled |
| confirmed | checked_out, cancelled |
| checked_out | returned, cancelled |
| returned | completed |
| completed | (terminal) |
| cancelled | (terminal) |

## Related
- [[stripe-payments]] — payment processing
- [[booking-wizard]] — how bookings are created
- [[notion-sync]] — Rentals DB sync on confirmation
- [[known-issues]] — webhook firing issue

## Sources
- Built: 2026-04-18
