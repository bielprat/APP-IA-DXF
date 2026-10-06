import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.E2E_PORT ?? 3100);
const baseURL = `http://localhost:${port}`;

// E2E runs against `next dev` with the local-only dev login enabled.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // `next dev` compiles each route on first use, and the render flow runs several background jobs.
  timeout: 120_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // Optional: reuse a preinstalled Chromium instead of the one matching this Playwright version.
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
      : {},
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: `pnpm exec next dev --port ${port}`,
    url: `${baseURL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      APP_ENV: "local",
      AUTH_DEV_LOGIN: "true",
      AUTH_SECRET: process.env.AUTH_SECRET ?? "e2e-only-secret-not-for-production-000000",
      AUTH_URL: baseURL,
      ALLOWED_EMAIL_DOMAINS: "colomer-rifa.cat",
      ADMIN_EMAILS: "admin@colomer-rifa.cat",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://cr:cr@localhost:5432/colomer_rifa",
    },
  },
});
