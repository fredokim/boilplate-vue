import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    // `npm run dev` runs predev first — generate, lint, typecheck — so the
    // server takes a while to appear. The default 60s timeout is not enough.
    command: "npm run dev -- --host 127.0.0.1",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
  use: {
    baseURL: "http://127.0.0.1:5173",
    // Locally this runs in the Edge already installed on the machine. CI has no
    // Edge and falls back to the Chromium Playwright installs itself. Spread
    // rather than `channel: undefined`, which exactOptionalPropertyTypes rejects.
    ...(process.env.CI ? {} : { channel: "msedge" as const }),
    trace: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
