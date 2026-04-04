import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // GitHub Pages のサブパス対応（VITE_BASE_URL=/RepoName/ で設定）
  base: process.env.VITE_BASE_URL || "/",

  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "InfoWatch",
        short_name: "InfoWatch",
        description: "情報・セキュリティ通知アグリゲーター",
        theme_color: "#0f172a",
        background_color: "#0f172a",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icons/192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /\/data\/.+\.json/,
            handler: "NetworkFirst",
            options: {
              cacheName: "data-cache",
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 10 },
            },
          },
        ],
      },
    }),
  ],
});
