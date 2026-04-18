# Notion Sync

## Databases
| DB | ID | Sync Trigger |
|----|----|-------------|
| Clients | 22b5143cf7c245cdb943cdc522887223 | Registration, login, booking |
| Rentals | 00fb231905734cdaacebfc8c4c636c38 | Confirmed booking (webhook) |
| Equipment | 88e1f5e856044f589f9b626fca05ca9f | Admin catalog sync |
| Services | f98e3f1bec024b44ba2a382f19823c8c | — |
| AI Readiness | 325c2a32df0d80d79090caae298ec80f | Assessment submission |

## Code Locations
- `lib/notion-crm.ts` — Clients and Rentals sync
- `lib/notion-assessment.ts` — AI Readiness Assessment sync

## Webhook
- Single-record Notion button push pattern
- Recent refactor: commit 621050d

## Parent Page
- Impact Studio Home: 28bc2a32df0d82aea86c81483bf24a6f

## Related
- [[booking-wizard]] — booking confirmation triggers Rentals DB sync
- [[aws-infrastructure]] — Notion API key in Amplify env vars

## Sources
- Journal entries: 026
- Recent commits: 621050d
