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
// SKIPPED: this journey is blocked by a genuine app bug, not a flaky test.
//
// server/vite.ts:30-33 installs a custom Vite logger whose `error` handler
// calls `process.exit(1)` after logging ANY error the Vite dev server
// reports, including errors the browser's HMR client reports back over the
// websocket. Loading the app in a real browser (Chromium, via this
// Playwright test) reliably triggers one such client-reported error -
// "[vite] (client) [Unhandled error] Error: @vitejs/plugin-react can't
// detect preamble. Something is wrong." pointing at
// client/src/components/ui/toast.tsx:109 - and that one call to
// process.exit(1) kills the entire dev server process (API included), not
// just the Vite middleware. Confirmed reproducible on 3/3 separate `pnpm
// run dev` runs, both under Playwright's own webServer management and
// started by hand, every time within 1-2 seconds of the first real browser
// load of "/".
//
// A likely contributing factor: server/vite.ts:53-56 appends a fresh
// `?v=<nanoid>` cache-busting query string to the main.tsx entry script on
// every single request, so the entry module's URL changes on every load.
// That is unusual and is a plausible reason @vitejs/plugin-react's
// fast-refresh preamble (injected against the original, un-suffixed entry
// URL) fails to line up with the module Vite actually serves.
//
// This is application source (server/vite.ts), which this test suite is
// not permitted to modify, and dev-only (server/static.ts, the production
// path, does not use Vite's middleware at all so it can't hit this). Report
// filed; test left runnable-but-skipped so it can be re-enabled once fixed.
test.skip('add a child, complete a chore, pay out, and see it in history', async ({ page }) => {
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
