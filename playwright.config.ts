import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  timeout: 60000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5187",
    channel: process.env.PW_BROWSER_CHANNEL || undefined,
    viewport: { width: 1440, height: 960 },
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run dev -- --port 5187 --strictPort",
    url: "http://127.0.0.1:5187",
    reuseExistingServer: false,
  },
});
