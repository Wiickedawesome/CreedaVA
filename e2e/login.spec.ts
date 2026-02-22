import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
  });

  test("displays the Google sign-in button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /sign in with google/i }),
    ).toBeVisible();
  });

  test("page title contains CreedaVA", async ({ page }) => {
    await expect(page).toHaveTitle(/creeda/i);
  });

  test("shows authorization notice", async ({ page }) => {
    await expect(
      page.getByText(/Sign in to access your CreedaVA dashboard/i),
    ).toBeVisible();
  });
});
