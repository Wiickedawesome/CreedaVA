import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // `import.meta.dirname` rather than `__dirname`: Vite's native config
      // loader does not provide `__dirname` and warns about it.
      "@": resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./__tests__/setup.ts"],
    include: ["__tests__/**/*.test.{ts,tsx}"],
    globals: true,
    css: false,
  },
});
