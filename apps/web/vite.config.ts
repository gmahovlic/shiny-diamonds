import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [preact()],
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
});
