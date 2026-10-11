import preact from "@preact/preset-vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

/** Cloudflare Web Analytics beacon, only when a token is configured at build time. */
function analytics(token: string | undefined): Plugin {
  return {
    name: "cf-analytics",
    transformIndexHtml(html) {
      if (!token) return html;
      const tag = `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token": "${token}"}'></script>`;
      return html.replace("</body>", `${tag}\n  </body>`);
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    preact(),
    analytics(loadEnv(mode, process.cwd(), "VITE_").VITE_CF_ANALYTICS_TOKEN),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        // App shell only. Never cache the API or the WebSocket.
        globPatterns: ["**/*.{js,css,html,svg,webmanifest}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "fonts",
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: "es2018",
    cssTarget: "chrome70",
    sourcemap: false,
  },
  server: {
    proxy: {
      "/api": { target: "http://localhost:8787", ws: true, changeOrigin: true },
    },
  },
}));
