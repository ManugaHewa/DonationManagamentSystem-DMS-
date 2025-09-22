import { defineConfig } from "vite";
import path from "node:path";

// Root is the Frontend folder. Build goes to dist/Frontend.
export default defineConfig({
  root: path.resolve(process.cwd(), "src", "Frontend"),
  server: {
    port: 5173,
    open: true,
    proxy: {
      // Proxy API and health to the backend during dev
      "/api": "http://localhost:3000",
      "/health": "http://localhost:3000"
    }
  },
  build: {
    outDir: path.resolve(process.cwd(), "dist", "Frontend"),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "src", "Frontend")
    }
  }
});
