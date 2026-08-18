import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    setupFiles: [path.resolve(import.meta.dirname, "tests/unit/setup.ts")],
    include: ["tests/unit/**/*.test.ts", "client/src/**/*.test.ts"],
    reporters: ["default"],
  },
});
