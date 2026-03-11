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

## Notion Integration (pending)
- Clients DB: 22b5143cf7c245cdb943cdc522887223
- Rentals DB: 00fb231905734cdaacebfc8c4c636c38
- Equipment DB: 88e1f5e856044f589f9b626fca05ca9f
- Services DB: f98e3f1bec024b44ba2a382f19823c8c

## Build & Deploy
```bash
npm run dev         # Local development
npm run build       # Production build
npm run typecheck   # Type checking
```
Git push to main triggers Amplify auto-build.
