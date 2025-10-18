import { Router, type Request, type Response } from 'express';
import { Octokit } from '@octokit/rest';

const router = Router();

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'rodlunt';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'choresandrewardsV2';

interface BugReportPayload {
  issueType: 'bug' | 'feature';
  category: string;
  description: string;
  stepsToReproduce?: string;
  expectedBehavior?: string;
  actualBehavior?: string;
  screenshot?: string | null;
  technicalInfo: {
    timestamp: string;
    userAgent: string;
    url: string;
    resolution: string;
    appVersion: string;
    buildNumber: string;
  };
}

// POST /api/issues/create
router.post('/create', async (req: Request, res: Response) => {
  try {
    const {
      issueType,
      category,
      description,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior,
      screenshot,
      technicalInfo,
    } = req.body as BugReportPayload;

    // Validate required fields
    if (!issueType || !category || !description) {
      return res.status(400).json({
        message: 'Missing required fields: issueType, category, description',
      });
    }

    if (!GITHUB_TOKEN) {
      console.error('GITHUB_TOKEN not configured');
      return res.status(500).json({
        message: 'GitHub integration not configured. Please contact support.',
      });
    }

    // Initialize Octokit
    const octokit = new Octokit({
      auth: GITHUB_TOKEN,
    });

    // Generate labels
    const labels: string[] = [
      'user-submitted',
      issueType === 'bug' ? 'bug' : 'enhancement',
      category.toLowerCase().replace(/\s+/g, '-'),
    ];

    // Build issue title (max 60 chars for description)
    const titlePrefix = issueType === 'bug' ? 'Bug' : 'Feature';
    const shortDesc = description.length > 60 ? description.substring(0, 57) + '...' : description;
    const title = `[User Report] ${titlePrefix}: ${shortDesc}`;

    // Build issue body
    let body = `## ${issueType === 'bug' ? 'Bug Report' : 'Feature Request'}\n\n`;
    body += `**Category**: ${category}\n\n`;
    body += `**Description**:\n${description}\n\n`;

    if (issueType === 'bug') {
      if (stepsToReproduce) {
        body += `**Steps to Reproduce**:\n${stepsToReproduce}\n\n`;
      }
      if (expectedBehavior) {
        body += `**Expected Behavior**:\n${expectedBehavior}\n\n`;
      }
      if (actualBehavior) {
        body += `**Actual Behavior**:\n${actualBehavior}\n\n`;
      }
    }

    // Add technical info
    body += `---\n\n`;
    body += `**Technical Information**:\n`;
    body += `- **Timestamp**: ${technicalInfo.timestamp}\n`;
    body += `- **URL**: ${technicalInfo.url}\n`;
    body += `- **Browser**: ${technicalInfo.userAgent}\n`;
    body += `- **Resolution**: ${technicalInfo.resolution}\n`;
    body += `- **App Version**: ${technicalInfo.appVersion}\n`;
    body += `- **Build**: ${technicalInfo.buildNumber}\n`;

    // Create GitHub issue
    const issueResponse = await octokit.issues.create({
      owner: GITHUB_REPO_OWNER,
      repo: GITHUB_REPO_NAME,
      title,
      body,
      labels,
    });

    const issueNumber = issueResponse.data.number;
    console.log(`Created issue #${issueNumber}: ${title}`);

    // Handle screenshot upload if provided
    if (screenshot && screenshot.startsWith('data:image')) {
      try {
        // Extract base64 data
        const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');

        // Generate filename
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `bug-report-${issueNumber}-${timestamp}.png`;
        const filePath = `screenshots/${filename}`;

        // Get reference to main branch to create screenshots branch if needed
        let screenshotBranch = 'bug-report-screenshots';
        try {
          await octokit.git.getRef({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            ref: `heads/${screenshotBranch}`,
          });
        } catch (error) {
          // Branch doesn't exist, create it from main
          const mainRef = await octokit.git.getRef({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            ref: 'heads/main',
          });

          await octokit.git.createRef({
            owner: GITHUB_REPO_OWNER,
            repo: GITHUB_REPO_NAME,
            ref: `refs/heads/${screenshotBranch}`,
            sha: mainRef.data.object.sha,
          });
        }

        // Upload screenshot to bug-report-screenshots branch
        await octokit.repos.createOrUpdateFileContents({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          path: filePath,
          message: `Add screenshot for issue #${issueNumber}`,
          content: base64Data,
          branch: screenshotBranch,
        });

        // Add comment with screenshot to the issue
        const screenshotUrl = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${screenshotBranch}/${filePath}`;
        await octokit.issues.createComment({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          issue_number: issueNumber,
          body: `**Screenshot**:\n\n![Screenshot](${screenshotUrl})`,
        });

        console.log(`Uploaded screenshot for issue #${issueNumber}`);
      } catch (screenshotError) {
        console.error('Failed to upload screenshot:', screenshotError);
        // Don't fail the whole request if screenshot upload fails
        await octokit.issues.createComment({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          issue_number: issueNumber,
          body: '_Note: Screenshot upload failed, but report was successfully created._',
        });
      }
    }

    res.json({
      success: true,
      issueNumber,
      url: issueResponse.data.html_url,
    });
  } catch (error) {
    console.error('Error creating GitHub issue:', error);
    res.status(500).json({
      message: 'Failed to create issue. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
