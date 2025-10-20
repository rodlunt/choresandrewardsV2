# Project TODO

## Current Status
✅ **All TypeScript errors fixed** - CI/CD pipeline passing
✅ **Windows compatibility fixed** - Added cross-env for npm scripts
✅ **Dev server working** - Running properly at http://localhost:5000
✅ **Viewport accessibility fixed** - Removed maximum-scale restriction

## Outstanding Items

### Bugs (User Reported - HIGH PRIORITY)
- [ ] **Favorites not independent per child**
  - **Issue**: Favorites should be independent for each child
  - **Current behavior**: [TO BE INVESTIGATED - need specific details]
  - **Expected**: Each child should have their own separate favorite chores list
  - **Technical notes**:
    - Schema is correct: `Child.favoriteChoreIds: string[]` (per-child array)
    - Storage layer `toggleFavoriteChore(childId, choreId)` looks correct
    - Hooks `useToggleFavoriteChore(childId)` properly scoped to child
    - Need to test in browser: Does toggling favorite for Child A affect Child B?
  - **Files to check**:
    - `client/src/lib/storage.ts` - toggleFavoriteChore method
    - `client/src/hooks/use-app-data.ts` - useToggleFavoriteChore hook
    - `client/src/pages/ChildChoresPage.tsx` - UI implementation
  - **Next steps**: Need user to provide specific reproduction steps

### Browser Console Warnings (Non-Critical)

#### Accessibility Issues
- [ ] Add aria-labels to icon-only buttons for screen reader support
  - Location: Various components using icon buttons without text
  - Impact: Screen readers cannot identify button purpose
  - Priority: Medium (improves accessibility compliance)

- [ ] Add title attributes to links and buttons
  - Error: "Element has no title attribute"
  - Multiple instances across the app
  - Priority: Low (warning, not breaking)

#### Compatibility Warnings
- [ ] Investigate `-webkit-text-size-adjust` CSS warning
  - Message: "is not supported by Chrome, Chrome Android, Edge 79+"
  - Likely from third-party CSS or Tailwind
  - Priority: Low (cosmetic warning only)

- [ ] Review `metaName=theme-color` meta tag format warning
  - Currently in client/index.html
  - Priority: Low (minor compatibility note)

#### Security
- [x] CSP blocking eval in JavaScript
  - This is actually a SECURITY FEATURE - working as intended
  - The app works properly despite this "error"
  - No action needed unless specific functionality breaks

## Recent Fixes (2025-10-20)

### TypeScript Compilation Errors
- Fixed chart.tsx tooltip and legend prop types for Recharts
- Fixed calendar.tsx to use react-day-picker v9 Chevron component API
- Removed incorrect isFavorite functionality from ChoresPage (favorites are child-specific)

### Windows Compatibility
- Installed cross-env package for environment variable support
- Updated npm scripts: `dev` and `start` to use cross-env
- Fixes "NODE_ENV is not recognized" error on Windows PowerShell/CMD

### Accessibility
- Removed maximum-scale=1 from viewport meta tag to allow user zooming

## Development Notes

### Running the Dev Server
**Important**: Due to Windows UNC path limitations, the dev server must be run from a mapped drive.

**From Windows Terminal (PowerShell/CMD) at E:\Prod\ChoresandRewards:**
```powershell
npm run dev
```

The server will start on http://localhost:5000

### Known Issues
- UNC path (\\homeserver\Prod\ChoresandRewards) causes issues with Windows CMD
- Dev server must be run from E:\Prod\ChoresandRewards (mapped drive)
- If lucide-react source maps get corrupted, reinstall: `npm install lucide-react --force`

## GitHub Actions Status
✅ All workflows passing:
- Validate and Deploy to Production: SUCCESS
- Deploy to Production: SUCCESS

Last successful deployment: 2025-10-20 (commit: 1cac122)
