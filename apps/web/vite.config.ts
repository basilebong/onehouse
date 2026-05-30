import { resolve } from "node:path";
import { parseEnv } from "@onehouse/core/shared";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const env = parseEnv(process.env);
const apiTarget = `http://localhost:${env.PORT}`;

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
      "/.well-known": { target: apiTarget, changeOrigin: true },
    },
  },
});
