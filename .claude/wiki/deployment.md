# Deployment

## Build Commands
```bash
npm run dev         # Local development
npm run build       # Production build
npm run typecheck   # Type checking
```

## Production Deploy
- Git push to `main` → Amplify auto-build
- Amplify App ID: d3utkrsna4mhfs
- Domain: impactstudio931.com

## Environment Variables
- **CRITICAL:** Live at branch level (`get-branch`, not `get-app`)
- **CRITICAL:** `update-branch --environment-variables` is FULL REPLACEMENT
- Always: read current → merge → write back

## Related
- [[aws-infrastructure]] — full resource inventory
