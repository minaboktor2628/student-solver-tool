import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    coverage: {
      provider: "v8", // built-in now
      reporter: ["text", "html"], // text summary in console + HTML report
    },
  },
});
