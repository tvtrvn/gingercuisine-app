import { test as setup, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const authFile = "e2e/.auth/dashboard.json";

// Logs in once and saves the dashboard session cookie. Other tests reuse this
// via `storageState`, so they start already authenticated.
setup("authenticate as dashboard staff", async ({ page }) => {
  const password = process.env.DASHBOARD_PASSWORD;
  expect(
    password,
    "DASHBOARD_PASSWORD must be set (loaded from .env.local) to run E2E.",
  ).toBeTruthy();

  await page.goto("/dashboard/login");
  await page.locator('input[type="password"]').fill(password!);
  await page.getByRole("button", { name: /sign in/i }).click();

  await page.waitForURL("**/dashboard");
  await expect(page.getByRole("link", { name: /menu/i })).toBeVisible();

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
