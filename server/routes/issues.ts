import { Router, type Request, type Response } from 'express';
import { Octokit } from '@octokit/rest';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { bugReportSchema } from '../../shared/schema';
import { logIssueEvent } from '../lib/log';
import { reportFault } from '../lib/glitchtip';
import { recordAcceptedSubmission, alertGithubApiFailure } from '../lib/ntfy';

const router = Router();

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO_OWNER = process.env.GITHUB_REPO_OWNER || 'rodlunt';
const GITHUB_REPO_NAME = process.env.GITHUB_REPO_NAME || 'choresandrewardsV2';

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024; // 5 MB decoded

// Detect the actual image format from its magic bytes rather than trusting
// the data URL's declared mime type. Only PNG, JPEG and WebP are accepted.
function detectImageType(buffer: Buffer): 'png' | 'jpeg' | 'webp' | null {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'png';
  }

  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }

  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }

  return null;
}

// A handful of reports per IP per hour is enough for genuine use and cheap
// to spam past, but keeps the endpoint from being used to mint unlimited
// GitHub issues and screenshot uploads.
//
// Keying: Cloudflare overwrites CF-Connecting-IP on every proxied request
// with the real visitor address, so through CF it is not attacker
// controllable, and Caddy passes it through untouched. X-Forwarded-For is
// useless here: Caddy has no trusted_proxies configured, so (since Caddy
// 2.5) it strips the incoming XFF and forwards only its own peer, which is
// the CF edge, and keying on req.ip would pool unrelated users per edge.
// The req.ip fallback covers direct LAN access, where the CF header is
// absent. Residual: a request that reaches the origin directly, bypassing
// Cloudflare, can forge CF-Connecting-IP; the only thing keyed off it is
// this limiter, so the exposure is limit evasion, nothing else.
const createIssueLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const cfIp = req.headers['cf-connecting-ip'];
    if (typeof cfIp === 'string' && cfIp.length > 0) {
      return ipKeyGenerator(cfIp);
    }
    return ipKeyGenerator(req.ip ?? '');
  },
  handler: (_req, res) => {
    logIssueEvent({ event: 'rejected-rate-limit', outcome: 'rejected', status: 429 });
    res.status(429).json({ message: 'Too many reports submitted. Please try again later.' });
  },
});

// POST /api/issues/create
router.post('/create', createIssueLimiter, async (req: Request, res: Response) => {
  const parseResult = bugReportSchema.safeParse(req.body);
  if (!parseResult.success) {
    // Reason category only (which field/rule failed), never the submitted
    // values themselves.
    const reason = parseResult.error.issues[0]?.path.join('.') || 'unknown';
    logIssueEvent({ event: 'rejected-validation', outcome: 'rejected', status: 400, reason });
    return res.status(400).json({
      message: 'Invalid bug report payload.',
    });
  }

  const {
    issueType,
    category,
    description,
    stepsToReproduce,
    expectedBehavior,
    actualBehavior,
    screenshot,
    technicalInfo,
  } = parseResult.data;

  // Validate the screenshot content server-side: the client's declared mime
  // type in the data URL prefix is not trustworthy on its own.
  let screenshotBase64: string | null = null;
  if (screenshot) {
    const base64Data = screenshot.replace(/^data:image\/\w+;base64,/, '');
    const decoded = Buffer.from(base64Data, 'base64');

    if (decoded.length > MAX_SCREENSHOT_BYTES) {
      logIssueEvent({ event: 'rejected-screenshot', outcome: 'rejected', status: 400, reason: 'too-large' });
      return res.status(400).json({
        message: 'Screenshot is too large.',
      });
    }

    if (!detectImageType(decoded)) {
      logIssueEvent({ event: 'rejected-screenshot', outcome: 'rejected', status: 400, reason: 'unrecognised-format' });
      return res.status(400).json({
        message: 'Screenshot does not look like a valid image.',
      });
    }

    screenshotBase64 = base64Data;
  }

  if (!GITHUB_TOKEN) {
    logIssueEvent({ event: 'token-missing', outcome: 'rejected', status: 503 });
    return res.status(503).json({
      message: 'Bug reporting is temporarily unavailable. Please contact support.',
    });
  }

  try {
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
    logIssueEvent({ event: 'submission-accepted', outcome: 'accepted', status: 201, issueNumber });
    recordAcceptedSubmission();

    // Handle screenshot upload if provided (already content-validated above)
    if (screenshotBase64) {
      try {
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
          content: screenshotBase64,
          branch: screenshotBranch,
        });

        // Link the screenshot into the issue. The blob URL works for
        // authenticated repo members even on a private repository, unlike
        // raw.githubusercontent.com, which GitHub's image proxy cannot
        // fetch for private repos (the inline embed would render broken).
        const screenshotUrl = `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/blob/${screenshotBranch}/${filePath}`;
        await octokit.issues.createComment({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          issue_number: issueNumber,
          body: `**Screenshot**: ${screenshotUrl}`,
        });

      } catch (screenshotError) {
        logIssueEvent({
          event: 'screenshot-upload-failed',
          outcome: 'error',
          status: 201,
          issueNumber,
          detail: screenshotError instanceof Error ? screenshotError.message : String(screenshotError),
        });
        // Best-effort fault report: the issue itself was created fine, so
        // this must never turn into a failed request.
        void reportFault({ event: 'screenshot-upload-failed', error: screenshotError, tags: { issueNumber: String(issueNumber) } });

        // Don't fail the whole request if screenshot upload fails
        await octokit.issues.createComment({
          owner: GITHUB_REPO_OWNER,
          repo: GITHUB_REPO_NAME,
          issue_number: issueNumber,
          body: '_Note: Screenshot upload failed, but report was successfully created._',
        });
      }
    }

    res.status(201).json({
      success: true,
      issueNumber,
      url: issueResponse.data.html_url,
    });
  } catch (error) {
    logIssueEvent({
      event: 'github-api-failure',
      outcome: 'error',
      status: 500,
      detail: error instanceof Error ? error.message : String(error),
    });
    // Genuine fault: the GitHub API call itself failed, so reports may be
    // getting lost. Report it (best-effort) and alert (throttled), since
    // otherwise this is invisible until someone notices no issues arriving.
    void reportFault({ event: 'github-api-failure', error });
    alertGithubApiFailure();

    res.status(500).json({
      message: 'Failed to create issue. Please try again.',
    });
  }
});

export default router;
