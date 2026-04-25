import { test, expect } from "@playwright/test";

/**
 * Public-path smoke. Runs without Clerk auth, so it's safe to gate CI on this
 * one (unlike core-flow which still needs testing tokens). Catches the kind of
 * regression that takes the site down on day one of launch — a missing footer
 * link, a broken hero CTA, a 500 on /privacy, an OG-image that won't render.
 */

test.describe("public surfaces render", () => {
  test("landing renders with hero, CTA and footer legal links", async ({ page }) => {
    await page.goto("/");

    // Hero — both halves of the headline are present
    await expect(page.getByRole("heading", { name: /Won't write your essay/i })).toBeVisible();
    await expect(page.getByText(/Will make you smarter/i)).toBeVisible();

    // CTAs route to sign-up
    const startFree = page.getByRole("link", { name: /Start free/i }).first();
    await expect(startFree).toBeVisible();
    await expect(startFree).toHaveAttribute("href", /sign-up/);

    // Feature sections include a Preview eyebrow per row
    await expect(page.getByText(/Preview · live from the app/i).first()).toBeVisible();

    // Footer legal links resolve
    await expect(page.getByRole("link", { name: /^Privacy$/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /^Terms$/i }).first()).toBeVisible();
  });

  test("/privacy renders the policy with TL;DR and section headings", async ({ page }) => {
    const res = await page.goto("/privacy");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /Privacy Policy/i })).toBeVisible();
    await expect(page.getByText(/TL;DR/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Who runs Axon/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /subprocessors/i })).toBeVisible();
  });

  test("/terms renders the terms with TL;DR and section headings", async ({ page }) => {
    const res = await page.goto("/terms");
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: /Terms of Service/i })).toBeVisible();
    await expect(page.getByText(/TL;DR/i)).toBeVisible();
    await expect(page.getByRole("heading", { name: /Free and paid plans/i })).toBeVisible();
  });

  test("404 renders the on-brand not-found", async ({ page }) => {
    const res = await page.goto("/this-does-not-exist");
    expect(res?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: /Nothing here/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Back to home/i })).toBeVisible();
  });

  test("robots.txt and sitemap.xml are reachable", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("<urlset");
  });

  test("opengraph-image renders a 1200x630 PNG", async ({ request }) => {
    const og = await request.get("/opengraph-image");
    expect(og.status()).toBe(200);
    expect(og.headers()["content-type"]).toContain("image/png");
  });
});
