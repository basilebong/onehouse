import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react";
// import tailwindcss from "@tailwindcss/vite";
// import { VitePWA } from "vite-plugin-pwa";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [
    // react(),
    // tailwindcss(),
    // VitePWA({
    //   registerType: "autoUpdate",
    //   injectRegister: "auto",
    //   manifest: {
    //     name: "Onehouse",
    //     short_name: "Onehouse",
    //     theme_color: "#0f172a",
    //     background_color: "#0f172a",
    //     display: "standalone",
    //     orientation: "portrait",
    //     start_url: "/",
    //     scope: "/",
    //     icons: [
    //       { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    //       { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    //       { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    //     ],
    //   },
    //   workbox: {
    //     globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /\/api\/.*$/,
    //         handler: "NetworkFirst",
    //         options: {
    //           cacheName: "api-cache",
    //           networkTimeoutSeconds: 3,
    //           backgroundSync: {
    //             name: "api-queue",
    //             options: { maxRetentionTime: 24 * 60 },
    //           },
    //         },
    //       },
    //     ],
    //   },
    // }),
  ],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:3000", ws: true, changeOrigin: true },
      "/mcp": { target: "http://localhost:3000", changeOrigin: true },
    },
  },
});
