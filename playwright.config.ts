import { defineConfig, devices } from "@playwright/test";

// E2E en viewport de celular (390 px), modo oscuro y claro.
export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3000" },
  webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true },
  projects: [
    { name: "celular-oscuro", use: { ...devices["Pixel 7"], colorScheme: "dark" } },
    { name: "celular-claro", use: { ...devices["Pixel 7"], colorScheme: "light" } },
  ],
});
