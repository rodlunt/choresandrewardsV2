# Setup Instructions for Chores & Rewards App

## Prerequisites

- Node.js (v18 or higher)
- npm (v8 or higher)
- Git
- GitHub account with personal access token

## Initial Setup

### 1. Fix UNC Path Issue (Windows)

The project is currently located on a network path (`\\HOMESERVER\Prod\ChoresandRewards`) which npm doesn't support. You have two options:

**Option A: Map Network Drive (Recommended)**
```bash
# Map the network share to drive Z:
net use Z: \\HOMESERVER\Prod

# Navigate to the project
cd Z:\ChoresandRewards

# Continue with setup from there
```

**Option B: Copy to Local Directory**
```bash
# Copy the entire project to a local directory
xcopy /E /I \\HOMESERVER\Prod\ChoresandRewards C:\Projects\ChoresandRewards

# Navigate to the local copy
cd C:\Projects\ChoresandRewards
```

### 2. Install Dependencies

After resolving the UNC path issue, install the required packages:

```bash
# Install all existing dependencies
npm install

# Install new dependencies for bug reporting feature
npm install html2canvas @octokit/rest

# Verify installation
npm list html2canvas @octokit/rest
```

Expected output:
```
chores-and-rewards@1.0.0
├── html2canvas@1.4.1
└── @octokit/rest@20.0.2
```

### 3. Configure Environment Variables

```bash
# Copy the example environment file
copy .env.example .env

# Edit .env with your favorite editor
notepad .env
```

Add your GitHub token:
```env
GITHUB_TOKEN=ghp_YourActualGitHubTokenHere
GITHUB_REPO_OWNER=rodlunt
GITHUB_REPO_NAME=choresandrewardsV2
```

To get a GitHub token:
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name: "Chores & Rewards Bug Reports"
4. Scopes: Check `repo`
5. Generate and copy the token

### 4. Verify TypeScript Compilation

```bash
# Check for TypeScript errors
npm run check
```

Fix any errors before proceeding.

### 5. Start Development Server

```bash
npm run dev
```

The app should start at http://localhost:5000

## Testing the Bug Report Feature

1. Open the app in your browser
2. Click the floating bug icon (bottom-right corner)
3. Fill out a test report:
   - Type: Bug Report
   - Category: User Interface
   - Description: "Testing bug report feature"
4. Click "Capture Screenshot" (optional)
5. Click "Submit Report"
6. Check your GitHub repository for the new issue

## Building for Production

```bash
# Build the app
npm run build

# Start production server
npm start
```

## Database Setup

The app uses IndexedDB for offline-first storage (client-side only). No database setup required!

If you want to enable the server-side Drizzle ORM features in the future:
```bash
# Push schema to database (requires DATABASE_URL)
npm run db:push
```

## Troubleshooting

### npm install fails
**Error**: `npm error UNC paths are not supported`
**Solution**: Follow step 1 above to map the network drive or copy locally

### TypeScript errors in BugReport.tsx
**Error**: `Cannot find module 'html2canvas'`
**Solution**: Run `npm install html2canvas`

### GitHub token not working
**Error**: "GitHub integration not configured"
**Solution**:
- Verify GITHUB_TOKEN is in `.env`
- Check token has `repo` scope
- Restart dev server after adding token

### Screenshot capture fails in browser
**Error**: Browser console shows CORS or security errors
**Solution**: This is expected in some cases - users can still submit without screenshot

## Package.json Updates Needed

The following dependencies need to be added to package.json:

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1",
    "@octokit/rest": "^20.0.2"
  }
}
```

You can add these manually or let `npm install html2canvas @octokit/rest` do it automatically.

## File Structure

```
ChoresandRewards/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── BugReport.tsx (NEW)
│   │   │   └── FeedbackButton.tsx (UPDATED)
│   │   └── App.tsx (UPDATED - FeedbackButton enabled)
│   └── public/
│       ├── manifest.json (UPDATED)
│       ├── sw.js (UPDATED)
│       └── icons/ (PNG files added)
├── server/
│   ├── routes/
│   │   └── issues.ts (NEW)
│   └── routes.ts (UPDATED)
├── .env.example (NEW)
├── BUG_REPORT_FEATURE.md (Existing - reference doc)
├── BUG_REPORT_IMPLEMENTATION.md (NEW - our implementation)
└── SETUP_INSTRUCTIONS.md (NEW - this file)
```

## Next Steps After Setup

1. Test the bug reporting feature
2. Test PWA installation on mobile devices
3. Review GitHub issues being created
4. Customize categories in `BugReport.tsx` if needed
5. Update app version in `.env` when releasing

## Support

For issues with:
- **Bug reporting feature**: See BUG_REPORT_IMPLEMENTATION.md
- **PWA features**: Check GitHub issue #2 and #3
- **App functionality**: Use the bug report feature itself!

## Recent Changes

- ✅ Issue #2: PWA icons configured (PNG files added)
- ✅ Issue #3: PWA install prompt improved (iOS support added)
- ✅ Issue #7: FeedbackButton enabled with full bug reporting
- ✅ Per-child favorite chores feature implemented

## Pending Tasks

See GitHub issues for remaining tasks:
- Issue #1: npm install (requires fixing UNC path first)
- Issue #4: Clean up attached_assets folder
- Issue #5: Fix .gitignore duplicates
- Issue #6: Remove sound file references in sw.js (already done)
- Issue #8: Update npm dependencies
- Issue #9: Add error boundaries
