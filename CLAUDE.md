# Impact Studio — Claude Code Guide

## What This Is
Equipment rental landing page for Impact Studio (JHR Photography LLC). MVP focused on gear rental with Stripe checkout.

## Tech Stack
- Next.js 14 (App Router, TypeScript, standalone output)
- Tailwind CSS (dark studio aesthetic)
- AWS Amplify (hosting), DynamoDB (bookings), S3 (signatures/COI), CloudFront (CDN)
- Stripe (payments)

## AWS Resources
- Amplify App ID: d3utkrsna4mhfs
- DynamoDB Table: impact-studio-content
- S3 Bucket: impact-studio-assets
- CloudFront: d2jen1l9e002bl.cloudfront.net (Distribution E48Q4GT49NJP3)
- Route 53 Zone: Z051494619SAYQPDBUAPQ
- Domain: impactstudio931.com

## Key Patterns
- Equipment catalog is static data in /content/equipment-catalog.ts
- Booking flow is a multi-step wizard at /book
- Digital signatures captured via canvas, stored as PNG in S3
- Stripe Checkout Sessions for payment, manual capture for $500 insurance holds
- Email notifications via AWS SES to renter + ops (angus@jhr-photography.com)

## Build & Deploy
```bash
npm run dev         # Local development
npm run build       # Production build
npm run typecheck   # Type checking
```
Git push to main triggers Amplify auto-build.
