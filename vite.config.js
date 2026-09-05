import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  root: "frontend",
  base: "./",
  plugins: [react()],
  build: { outDir: "../dist", assetsDir: "app-assets", emptyOutDir: true },
  server: { port: 4173 },
});
