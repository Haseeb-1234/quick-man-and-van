import { defineConfig, devices } from "playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "https://laxamigroupsltd.com",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: false, // keep visible so you can watch the flow
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
})
