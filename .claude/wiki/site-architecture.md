# Site Architecture

## Tech Stack
- Next.js 14 (App Router, TypeScript, standalone output)
- Tailwind CSS (light theme, gold accent #C8A96E)

## Routes
| Route | Page | Theme |
|-------|------|-------|
| `/` | Homepage — services, features, pricing, CTAs | Light + dark hero/CTA/footer |
| `/about` | Studio story, the space, stats | Light |
| `/studio-rental` | Studio packages, features, booking | Light |
| `/equipment-rental` | Equipment catalog with pricing | Light |
| `/book` | Multi-step booking wizard | Light |
| `/policies` | Rental policies & procedures | Light |
| `/privacy` | Privacy policy | Light |
| `/terms` | Equipment rental agreement | Light |
| `/ai-policy` | AI transparency policy | Light |

## Design System
- **Light theme:** White backgrounds, dark text, gold accent (#C8A96E)
- **Dark sections:** Hero, CTA blocks, footer
- **Logo:** `/public/images/logo-dark.png` (light sections), `/public/images/logo-white.png` (dark sections)
- Cookie consent banner with localStorage preference

## Related
- [[booking-wizard]] — the `/book` route
- [[equipment-catalog]] — the `/equipment-rental` route
