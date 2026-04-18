# Impact Studio Wiki — Log

## [2026-04-18] build | Rental POS management system
- Fixed price display bug (cents→dollars) in admin rentals page
- Fixed webhook email recipients (use env vars, added admin@impactstudio931.com)
- Made webhook emails non-blocking (won't fail the webhook on SES error)
- Built rental detail page `/admin/rentals/[id]` with full POS functionality
- Built `PATCH /api/admin/rentals/[id]` for status changes and notes
- Added status workflow: pending→confirmed→checked_out→returned→completed
- Added notes system and activity timeline
- Added deposit management UI (release hold, charge for damage)
- Status change emails to customer and admin
- Updated rentals list with clickable rows, new status colors, counts
- Created rental-management.md wiki page
- Updated known-issues.md with webhook firing issue
- **Identified**: Stripe webhook likely not firing (Hannah's rentals stuck at pending, 0 SES emails sent)

## [2026-04-18] init | Wiki system scaffolded
- Created wiki structure based on Karpathy LLM Wiki pattern
- Seeded index with initial page categories from CLAUDE.md and codebase knowledge
- Created vault integration note for future Obsidian sync
- This is the model project — pattern will replicate to other JHR projects
- **Source:** Conversation with Jayson, CLAUDE.md, project structure
