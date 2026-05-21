import { resolve } from "node:path";
import { defineConfig } from "vite";

const apiTarget = `http://localhost:${process.env.PORT ?? 3000}`;

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: apiTarget, ws: true, changeOrigin: true },
      "/mcp": { target: apiTarget, changeOrigin: true },
    },
  },
});
