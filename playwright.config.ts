import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";

// Load .env.local the same way Next does, so the config + test workers see
// TEST_DATABASE_URL and the dashboard secrets (DASHBOARD_PASSWORD, etc.).
loadEnvConfig(process.cwd());

const PORT = 3100; // separate from `next dev` (3000) so a running dev server is untouched
const BASE_URL = `http://localhost:${PORT}`;
const TEST_DB = process.env.TEST_DATABASE_URL;

if (!TEST_DB) {
  // We deliberately do NOT fall back to DATABASE_URL — these tests WRITE to the
  // DB (sold-out toggles, custom items). Point TEST_DATABASE_URL at a throwaway
  // MongoDB in .env.local before running.
  console.warn(
    "\n[playwright] TEST_DATABASE_URL is not set. The test server will fail to " +
      "reach a database. Set TEST_DATABASE_URL (a throwaway MongoDB) in " +
      ".env.local before running E2E.\n",
  );
}

export default defineConfig({
  testDir: "./e2e",
  // Tests mutate shared menu-customization state, so run them serially.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Runs every e2e/*.setup.ts: DB reset (wipe leftover menu overrides /
    // orders from interrupted runs) + dashboard auth.
    { name: "setup", testMatch: /\.setup\.ts$/ },
    {
      name: "chromium",
      dependencies: ["setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/dashboard.json",
      },
    },
  ],
  webServer: {
    command: `next dev -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      // Override ONLY the database; everything else comes from .env.local.
      DATABASE_URL: TEST_DB ?? "",
      // Hard isolation: e2e runs must never send real customer emails or
      // consume the production Upstash quota. Blank keys make email a warn-
      // and-skip no-op and rate limiting the dev no-op limiter.
      RESEND_API_KEY: "",
      UPSTASH_REDIS_REST_URL: "",
      UPSTASH_REDIS_REST_TOKEN: "",
    },
  },
});
