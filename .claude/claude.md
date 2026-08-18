# Claude Code Session Notes

## Quick Start Reminder
**IMPORTANT**: Check `TODO.md` in the project root at the start of each session for current outstanding items.

## Project Overview
This is a family chore tracking and rewards application built with:
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js. Serves the built SPA and one API route: `/api/issues`, which
  files a bug report as a GitHub issue via Octokit.
- **Data storage**: client-side only, IndexedDB via `idb`. There is no database and no server-side
  persistence.
- **Deployment**: Docker Compose on a home server, via GitHub Actions CI (see `.github/DEPLOYMENT.md`).

## Key Project Information

### Repository
- GitHub: rodlunt/choresandrewardsV2
- Main branch: `main`
- CI: validate (audit, tsc, build) then deploy, on every push to `main`

### Directory Structure
- `client/` - React frontend application
  - `src/components/` - React components
  - `src/pages/` - Page components
  - `src/hooks/` - Custom React hooks
  - `public/` - Static assets and PWA files
- `server/` - Express backend (serves the SPA build and the `/api/issues` route)
- `shared/` - Shared TypeScript types and schemas (Zod)
- `.claude/` - Claude Code configuration

### Important File Locations
- **TODO List**: `TODO.md` (root directory)
- **Package management**: `package.json` (root), pnpm
- **TypeScript config**: `tsconfig.json`
- **Vite config**: `vite.config.ts`
- **Schema definitions**: `shared/schema.ts`

### Common Commands
```bash
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run check    # TypeScript type checking
```

## Architecture Notes

### Favorites System
**IMPORTANT**: Favorites are **child-specific**, not global chore properties.
- Favorites stored in: `Child.favoriteChoreIds: string[]`
- NOT stored on Chore entity (Chore does NOT have `isFavorite` property)
- ChoresPage.tsx: Global chore management (no favorites)
- ChildChoresPage.tsx: Child-specific view (includes favorites)

### Data Schema (shared/schema.ts)
- **Child**: id, name, totalCents, favoriteChoreIds[], createdAt
- **Chore**: id, title, valueCents, createdAt
- **Payout**: id, childId, childName, amountCents, createdAt
- **Settings**: haptics, confetti, displayMode

All of the above live in the browser's IndexedDB, not on the server.

## Tips for Future Sessions

1. **Always check `TODO.md` first** for current outstanding items.
2. **TypeScript**: Run `pnpm run check` before committing to catch errors.
3. **Favorites**: Remember they're child-specific (Child.favoriteChoreIds), not on Chore entity.

## Contact & Support
- GitHub Issues: https://github.com/rodlunt/choresandrewardsV2/issues
- Main developer: rodlunt
