import { expect, test } from "@playwright/test";

// E2E pyramid is small — one happy path per feature. See .claude/rules/testing.md.

test.skip("app loads and renders shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Onehouse/);
});
