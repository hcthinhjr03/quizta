import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const backend = "http://localhost:3001";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // cho phép điện thoại cùng Wi-Fi truy cập khi dev
    proxy: { "/api": backend, "/media": backend },
  },
});
