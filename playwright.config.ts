import { defineConfig } from "@playwright/test";

const port = process.env.PORT ?? "3105";
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testMatch: ["**/*.pw.ts"],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${port}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180000,
        url: baseURL
      },
  use: {
    baseURL,
    trace: "retain-on-failure"
  }
});
