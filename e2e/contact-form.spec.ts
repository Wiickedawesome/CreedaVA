import { test, expect } from "@playwright/test";

test.describe("Contact Form", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept the Cloud Function call so the test is self-contained
    await page.route("**/handleFormWebhook", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await page.goto("/contact");
  });

  test("renders contact form fields", async ({ page }) => {
    await expect(page.getByRole("textbox", { name: /first name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /last name/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /email/i })).toBeVisible();
  });

  test("submits form and shows success state", async ({ page }) => {
    await page.getByRole("textbox", { name: /first name/i }).fill("Test");
    await page.getByRole("textbox", { name: /last name/i }).fill("User");
    await page.getByRole("textbox", { name: /email/i }).fill("test@example.com");

    // Fill message / textarea
    const messageField = page.locator("textarea");
    await messageField.fill("Hello, this is an E2E test message.");

    await page.getByRole("button", { name: /send|submit/i }).click();

    // Success panel should appear (contains a checkmark SVG and success heading)
    await expect(page.locator(".bg-success\\/10, [class*='bg-success']")).toBeVisible({
      timeout: 10_000,
    });
  });
});
