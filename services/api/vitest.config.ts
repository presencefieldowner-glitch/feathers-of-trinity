import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["tests/**/*.test.ts"],
    testTimeout: 15000,
    hookTimeout: 15000,
    fileParallelism: false,
    globalSetup: ["./tests/global-setup.ts"],
    env: {
      JWT_SECRET: "test-secret-key",
      JWT_EXPIRES_IN: "1h",
      STRIPE_WEBHOOK_SECRET: "whsec_test_secret",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.ts"],
    },
  },
});
