import { test, expect } from '@playwright/test';

// End-to-end happy path: first run through to a payout landing in history.
// Each Playwright test gets a fresh browser context (and therefore a fresh,
// empty IndexedDB), so the app starts on the first-run screen without any
// setup on our part.
//
// Once a child exists, App.tsx can pop a "Back up your data" reminder toast
// (see BACKUP_REMINDER_* in client/src/App.tsx). It doesn't intercept
// clicks, so this test doesn't wait for or dismiss it - it also never
// asserts on the toast's copy, since that text belongs to the app, not to
// this test.
// This journey originally could not run: the CSP (script-src 'self')
// blocked Vite's inline react-refresh preamble in dev, and the template's
// custom Vite logger then killed the whole dev server with process.exit(1)
// when the browser reported that error. Both fixed in this PR (CSP is now
// production-only in server/index.ts; the exit-on-log is gone from
// server/vite.ts), so the journey runs.
test('add a child, complete a chore, pay out, and see it in history', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('input-first-child-name')).toBeVisible();

  const childName = `Test Child ${Date.now()}`;
  await page.getByTestId('input-first-child-name').fill(childName);
  await page.getByTestId('button-add-first-child').click();

  // Lands on the family dashboard with the new child's card present.
  await expect(page.getByTestId('nav-home')).toBeVisible();
  const childNameOnCard = page.locator('[data-testid^="text-child-name-"]', { hasText: childName });
  await expect(childNameOnCard).toBeVisible();

  // Open that child's chores.
  await page.locator('[data-testid^="button-view-chores-"]').click();

  await expect(page.getByTestId('text-child-name')).toHaveText(`${childName}'s Chores`);
  await expect(page.getByTestId('text-child-total')).toHaveText('$0.00 earned');

  // Complete the first chore in the list and confirm the balance moved by
  // exactly that chore's value (default chores are all $1.00 or $5.00).
  const firstChoreCard = page.locator('[data-testid^="card-chore-"]').first();
  const choreValueText = await firstChoreCard.locator('[data-testid^="text-chore-value-"]').innerText();
  const choreValueCents = Math.round(parseFloat(choreValueText.replace('$', '')) * 100);

  await firstChoreCard.locator('[data-testid^="button-complete-chore-"]').click();

  const expectedTotal = `$${(choreValueCents / 100).toFixed(2)} earned`;
  await expect(page.getByTestId('text-child-total')).toHaveText(expectedTotal);

  // Pay out and confirm.
  await page.getByTestId('button-payout').click();
  await expect(page.getByTestId('button-confirm-payout')).toBeVisible();
  await page.getByTestId('button-confirm-payout').click();

  // Balance resets to zero and the "ready for payout" section disappears.
  await expect(page.getByTestId('text-child-total')).toHaveText('$0.00 earned');
  await expect(page.getByTestId('button-payout')).toHaveCount(0);

  // The payout shows up on the History page.
  await page.getByTestId('nav-history').click();
  const payoutCard = page.locator('[data-testid^="card-payout-"]');
  await expect(payoutCard).toBeVisible();
  await expect(payoutCard.locator('[data-testid^="text-payout-child-"]')).toHaveText(childName);
  await expect(payoutCard.locator('[data-testid^="text-payout-amount-"]')).toHaveText(
    `$${(choreValueCents / 100).toFixed(2)}`,
  );
});
