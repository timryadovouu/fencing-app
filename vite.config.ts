import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { defineConfig } from "vitest/config";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Fencing Protocols",
        short_name: "Fencing",
        description: "Offline pool sheets and direct elimination tables",
        lang: "en",
        theme_color: "#111417",
        background_color: "#111417",
        display: "standalone",
        orientation: "any",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,webmanifest}"],
        navigateFallback: "/index.html",
        // pdfmake со шрифтом весит больше стандартного лимита — нужен офлайн тоже.
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  server: { host: true, allowedHosts: [".local"] },
  preview: { host: true, allowedHosts: [".local"] },
  // pdfmake (~1 МБ) грузится отдельно и только при экспорте в PDF.
  build: { chunkSizeWarningLimit: 1100 },
  test: {
    include: ["src/**/*.test.ts"],
  },
});
