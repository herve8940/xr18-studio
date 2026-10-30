import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Two pages: the full app (index.html, local only) and the musicians' monitor page
  // (ears.html, served on the local network by the QR-link server).
  build: { rollupOptions: { input: { main: resolve(__dirname, "index.html"), ears: resolve(__dirname, "ears.html") } } },
  server: { host: "127.0.0.1", port: 5173, proxy: {
    "/api": "http://127.0.0.1:3000",
    "/ws": { target: "ws://127.0.0.1:3000", ws: true },
  }},
});
