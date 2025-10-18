# Bug Report Feature - Complete Implementation Documentation

## Quick Summary

The Business Review 360 app has a complete bug report system with:
- Screenshot capture (html2canvas)
- Form for collecting bug/feature details
- Automatic GitHub issue creation
- Screenshot upload to GitHub
- Metadata collection (browser, resolution, URL, etc)

## Key Files

### Frontend
- `frontend/src/components/BugReport.js` - Main dialog component
- `frontend/src/components/Footer.js` - Report button
- `frontend/src/components/Layout.js` - Dialog state management

### Backend
- `backend/src/routes/issues.js` - API endpoints
- `backend/src/index.js` - Route registration (line 220)

## Frontend Flow

1. User clicks "Report" button in footer
2. BugReport dialog opens
3. User can:
   - Select issue type (Bug or Feature)
   - Select category
   - Enter description and details
   - Capture screenshot (html2canvas)
   - Submit report

## Screenshot Capture

Location: `BugReport.js` lines 64-100

Process:
1. Hide dialog temporarily
2. Use html2canvas to capture document.body
3. Configuration: scale=0.8, quality=0.8, PNG format
4. Store as base64 data URL
5. Display preview in dialog

Result: Base64 string in component state

## Backend Processing

Location: `backend/src/routes/issues.js`

POST /api/issues/create receives:
```javascript
{
  issueType: 'bug' | 'feature',
  category: string,
  description: string,
  stepsToReproduce: string,
  expectedBehavior: string,
  actualBehavior: string,
  screenshot: base64_data_url,
  userInfo: { username, email, orgId },
  technicalInfo: { timestamp, userAgent, url, resolution, buildNumber, appVersion }
}
```

Processing steps:
1. Validate required fields
2. Generate labels: ["user-submitted", "bug"/"enhancement", "org:orgid", "category"]
3. Extract base64 screenshot to Buffer
4. Build markdown issue body
5. Create GitHub issue with Octokit
6. Upload screenshot to bug-report-screenshots branch
7. Add comment with image markdown
8. Return success response

## Technical Info Collected

- Timestamp (ISO)
- User Agent
- Current URL
- Window Resolution
- Build Number (VITE_BUILD_NUMBER)
- App Version (VITE_APP_VERSION)
- Username (from JWT)
- Email (from JWT)
- Organization ID

## Environment Variables

Backend:
- GITHUB_TOKEN (required)
- GITHUB_REPO_OWNER (default: rodlunt)
- GITHUB_REPO_NAME (default: business-review-360)

Frontend:
- VITE_BUILD_NUMBER
- VITE_ADMIN_EMAIL
- VITE_APP_VERSION

## GitHub Integration

Uses Octokit API to:
1. Create issue in repository
2. Create/use bug-report-screenshots branch
3. Upload PNG file to branch
4. Add comment with image markdown link

Issue structure:
```
Title: [BR360] Bug/Feature: Description (max 60 chars)
Labels: user-submitted, bug/enhancement, org:orgid, category-kebab-case
Body: Formatted markdown with all fields
Comments: Screenshot with ![image](url) markdown
```

## Dependencies

Frontend: html2canvas, @mui/material, @mui/icons-material, axios
Backend: @octokit/rest, express, dotenv

## Testing

Test file: `testing/e2e/12-new-features.spec.js`

Tests:
1. Dialog opens
2. Screenshot capture works
3. Bug report submission
4. Feature request submission

## Error Handling

Frontend:
- Screenshot fails: Alert + retry
- Submission fails: Error message in dialog
- Validation: Submit button disabled until ready

Backend:
- Missing fields: 400 error
- GitHub error: 500 error
- Screenshot upload fails: Issue created, comment added with note

## Flask Implementation

To port to Flask:
1. Use PyGithub instead of Octokit
2. Same request/response structure
3. Same GitHub workflow
4. JWT auth verification
5. Base64 handling same way

Key differences:
- Flask routes instead of Express
- PyGithub API calls instead of Octokit
- Python string formatting instead of JS

## Security

- Requires authentication
- Rate limiting on API
- GitHub token in .env (not committed)
- Input validation on backend
- No secrets in reports
- Optional screenshots

