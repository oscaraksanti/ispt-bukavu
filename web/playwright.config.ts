import { defineConfig, devices } from "@playwright/test";

/**
 * Tests de bout en bout : l'application compilée (next start) contre une base
 * de test préparée par `npm run test:e2e:preparer`. Jamais contre la production.
 */
const PORT = Number(process.env.PORT_E2E ?? 3000);

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  timeout: 60_000,
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "fr-FR",
    serviceWorkers: "block",
    trace: "retain-on-failure",
    launchOptions: process.env.PW_CHROMIUM_PATH
      ? { executablePath: process.env.PW_CHROMIUM_PATH, args: ["--no-sandbox"] }
      : {},
  },
  projects: [
    { name: "bureau", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /accessibilite/ },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}/connexion`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
