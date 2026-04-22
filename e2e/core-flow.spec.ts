import { test, expect } from "@playwright/test";

/**
 * The Session 0 acceptance flow: onboarding Skip → Dashboard → Daily Study →
 * Again → micro-lesson (fallback, no real API key) → next card. This is the
 * minimum happy path the plan requires to exist end-to-end after the monolith
 * is split; deeper UX tests come in later sessions.
 */
test("onboarding skip → study a demo card → micro-lesson fallback → next card", async ({
  page,
}) => {
  // 1. Fresh visitor state
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");

  // 2. Skip onboarding with the demo deck
  await expect(page.getByText("The study tool")).toBeVisible();
  await page.getByRole("button", { name: /Skip — load demo deck/i }).click();

  // 3. Dashboard renders for "Student" (the finishWithDemo default name)
  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(page.getByRole("heading", { name: /Student\.$/ })).toBeVisible();

  // 4. Enter Daily Study via the dashboard CTA
  await page.getByRole("button", { name: /Start today's study/i }).click();
  await expect(page).toHaveURL(/\/study$/);

  // 5. Flip the first card
  await expect(page.getByRole("button", { name: /Show answer/i })).toBeVisible();
  await page.getByRole("button", { name: /Show answer/i }).click();

  // 6. Mark it Again to trigger the classifier
  await page.getByRole("button", { name: /^Again/i }).click();

  // 7. Fallback micro-lesson renders (no ANTHROPIC_API_KEY in this env, so the
  //    server route returns 500 and the client catches into fallbackClassifyError).
  await expect(page.getByText("Micro-lesson triggered")).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("90-second fix")).toBeVisible();

  // 8. Advance to the next card
  await page.getByRole("button", { name: /Got it — next card/i }).click();
  await expect(page.getByRole("button", { name: /Show answer/i })).toBeVisible();
});
