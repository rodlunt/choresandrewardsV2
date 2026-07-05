import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true, // Keep source maps for production debugging
    minify: false, // DEBUGGING: Disable to see full React error messages
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split vendor chunks for better caching (vite 8 requires the
          // function form; the object form fails type-check).
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/react(-dom)?\//.test(id)) return 'react-vendor';
          if (id.includes('@radix-ui/react-dialog') || id.includes('@radix-ui/react-toast') || id.includes('@radix-ui/react-checkbox')) return 'ui-vendor';
          return undefined;
        },
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
