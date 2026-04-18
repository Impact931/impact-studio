# Impact Studio — Claude Code Guide

## What This Is
Professional studio and equipment rental platform for Impact Studio (JHR Photography LLC). Full multi-page site with light theme, equipment rental, studio rental, and admin capabilities.

## Tech Stack
- Next.js 14 (App Router, TypeScript, standalone output)
- Tailwind CSS (light theme, gold accent #C8A96E)
- AWS Amplify (hosting), DynamoDB (bookings/content), S3 (signatures/COI/media), CloudFront (CDN)
- Stripe (payments, deposit holds via PaymentIntent manual capture + SetupIntent)
- AWS SES (transactional email)

## AWS Resources
- Amplify App ID: d3utkrsna4mhfs
- DynamoDB Table: impact-studio-content
- S3 Bucket: impact-studio-assets
- CloudFront: d2jen1l9e002bl.cloudfront.net (Distribution E48Q4GT49NJP3)
- Route 53 Zone: Z051494619SAYQPDBUAPQ
- Domain: impactstudio931.com

## Site Architecture
| Route | Page |
|-------|------|
| `/` | Homepage — services, features, pricing, CTAs |
| `/about` | Studio story, the space, stats |
| `/studio-rental` | Studio packages, features, booking |
| `/equipment-rental` | Equipment catalog with pricing |
| `/book` | Multi-step booking wizard |
| `/policies` | Rental policies & procedures |
| `/privacy` | Privacy policy |
| `/terms` | Equipment rental agreement |
| `/ai-policy` | AI transparency policy |

## Key Patterns
- Light theme: white backgrounds, dark text, gold accent (#C8A96E), dark hero/CTA/footer sections
- Logo: `/public/images/logo-dark.png` (light sections), `/public/images/logo-white.png` (dark sections)
- Equipment catalog is static data in `/content/equipment-catalog.ts`
- Booking flow is a multi-step wizard at `/book`
- Digital signatures captured via canvas, stored as PNG in S3
- Stripe Checkout Sessions for payment, PaymentIntent manual capture for deposit holds
- Email notifications via AWS SES (Reply-To: jayson + angus @jhr-photography.com)
- Cookie consent banner with localStorage preference

## Notion Integration (active)
- Clients DB: 22b5143cf7c245cdb943cdc522887223 — synced on registration, login, booking
- Rentals DB: 00fb231905734cdaacebfc8c4c636c38 — synced on confirmed booking (webhook)
- Equipment DB: 88e1f5e856044f589f9b626fca05ca9f
- Services DB: f98e3f1bec024b44ba2a382f19823c8c
- AI Readiness DB: 325c2a32df0d80d79090caae298ec80f — synced on assessment submit
- Sync code: `lib/notion-crm.ts` (clients/rentals), `lib/notion-assessment.ts` (assessments)
- Parent page: Impact Studio Home (28bc2a32df0d82aea86c81483bf24a6f)

## Build & Deploy
```bash
npm run dev         # Local development
npm run build       # Production build
npm run typecheck   # Type checking
```
Git push to main triggers Amplify auto-build.

## Project Wiki (`.claude/wiki/`)
This project uses the LLM Wiki pattern for persistent, compounding project knowledge.

### How It Works
- **Wiki pages** (`.claude/wiki/`) — synthesized, interlinked topic pages the LLM maintains
- **Memory files** (`~/.claude/projects/.../memory/`) — user prefs, feedback, references
- **Journal entries** (`~/Documents/jhr-ai-command/AI-Journey-Journal/`) — chronological raw source

### Session Protocol
After significant sessions:
1. Write journal entry → `AI-Journey-Journal/NNN-YYYY-MM-DD-topic.md`
2. Update relevant wiki pages (touch all affected topics, not just the one you worked on)
3. Append to `wiki/log.md` with date, operation type, and summary
4. Update `wiki/index.md` if new pages were created

### Wiki Operations
- **Ingest:** New knowledge → update wiki pages, cross-references, index, log
- **Query:** Read `wiki/index.md` first → drill into relevant pages → synthesize answer
- **Lint:** Periodically check for stale pages, missing cross-refs, contradictions with code

### Vault Integration
Wiki + journal sync to jhr-vault (Obsidian) for org-level browsing. See `memory/vault_integration.md` for setup instructions when ready.
