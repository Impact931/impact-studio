# AWS Infrastructure

## Resources
| Service | Resource | ID/ARN |
|---------|----------|--------|
| Amplify | App | d3utkrsna4mhfs |
| DynamoDB | Table | impact-studio-content |
| S3 | Bucket | impact-studio-assets |
| CloudFront | Distribution | E48Q4GT49NJP3 (d2jen1l9e002bl.cloudfront.net) |
| Route 53 | Zone | Z051494619SAYQPDBUAPQ |
| SES | Transactional email | jayson@, angus@ jhr-photography.com |

## Domain
- **Production:** impactstudio931.com
- **DNS:** Route 53 managed

## Deployment
- Git push to `main` triggers Amplify auto-build
- Next.js 14 standalone output mode
- Environment variables live at **branch level** (use `get-branch`, not `get-app`)
- **CRITICAL:** `update-branch --environment-variables` is full-replacement — always read current state, merge, then write back

## Related
- [[deployment]] — build/deploy playbook
- [[stripe-payments]] — Stripe keys in Amplify env vars
- [[notion-sync]] — Notion API key in Amplify env vars
