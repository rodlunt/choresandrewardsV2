# Claude Code Session Notes

## Quick Start Reminder
**IMPORTANT**: Check `TODO.md` in the project root at the start of each session for current outstanding items and project status.

## Project Overview
This is a family chore tracking and rewards application built with:
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: GitHub Actions CI/CD

## Key Project Information

### Repository
- GitHub: rodlunt/choresandrewardsV2
- Main branch: `main`
- CI/CD: Automated validation and deployment via GitHub Actions

### Directory Structure
- `client/` - React frontend application
  - `src/components/` - React components
  - `src/pages/` - Page components
  - `src/hooks/` - Custom React hooks
  - `public/` - Static assets and PWA files
- `server/` - Express backend
- `shared/` - Shared TypeScript types and schemas (Zod)
- `.claude/` - Claude Code configuration

### Important File Locations
- **TODO List**: `TODO.md` (root directory) - CHECK THIS FIRST EACH SESSION
- **Package management**: `package.json` (root)
- **TypeScript config**: `tsconfig.json`
- **Vite config**: `vite.config.ts`
- **Schema definitions**: `shared/schema.ts`

## Development Environment

### Windows-Specific Notes
- **Path**: Project located at `\\homeserver\Prod\ChoresandRewards` (UNC path)
- **Mapped Drive**: Also accessible via `E:\Prod\ChoresandRewards`
- **Dev Server**: Must be run from `E:\Prod\ChoresandRewards` due to Windows UNC path limitations
- **Cross-env**: Required for npm scripts to work on Windows (already installed)

### Running the Development Server
```powershell
# From PowerShell/CMD at E:\Prod\ChoresandRewards
npm run dev
```
Server runs on: http://localhost:5000

### Common Commands
```bash
npm run dev      # Start development server (requires cross-env)
npm run build    # Build for production
npm run check    # TypeScript type checking
npm run db:push  # Push database schema changes
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

## Recent Session Summary (2025-10-20)

### Completed
1. ✅ Fixed TypeScript compilation errors blocking CI/CD
2. ✅ Added cross-env for Windows npm script compatibility
3. ✅ Fixed dev server to run properly
4. ✅ Removed maximum-scale from viewport for accessibility
5. ✅ All GitHub Actions workflows passing

### Outstanding (see TODO.md)
- Browser console accessibility warnings (non-critical)
- Minor CSS compatibility warnings (cosmetic only)

## Tips for Future Sessions

1. **Always check `TODO.md` first** for current status and outstanding items
2. **Windows path issues**: Always run dev server from E:\ drive, not UNC path
3. **TypeScript**: Run `npm run check` before committing to catch errors
4. **Favorites**: Remember they're child-specific (Child.favoriteChoreIds), not on Chore entity
5. **Commits**: Include emoji and co-author attribution as shown in git history

## Git Workflow
- Commit message format includes:
  - Clear description of changes
  - Detailed bullet points
  - 🤖 Generated with Claude Code footer
  - Co-Authored-By: Claude <noreply@anthropic.com>

## Contact & Support
- GitHub Issues: https://github.com/rodlunt/choresandrewardsV2/issues
- Main developer: rodlunt
