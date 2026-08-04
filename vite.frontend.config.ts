import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "frontend"),
  resolve: {
    alias: {
      "@components": path.resolve(__dirname, "frontend/src/components"),
      "@content": path.resolve(__dirname, "frontend/src/components/content"),
      "@form": path.resolve(__dirname, "frontend/src/components/form"),
      "@intrinsic": path.resolve(__dirname, "frontend/src/components/intrinsic"),
      "@interop": path.resolve(__dirname, "frontend/src/interop"),
      "@main": path.resolve(__dirname, "frontend/src/components/main"),
      "@modal": path.resolve(__dirname, "frontend/src/components/modal"),
      "@utils": path.resolve(__dirname, "frontend/src/components/utils"),
    },
  },
  build: {
    outDir: path.resolve(__dirname, "dist/frontend"),
    emptyOutDir: true,
    sourcemap: "inline",

    rollupOptions: {
      input: path.resolve(__dirname, "frontend/src/index.tsx"), 
      output: {
        entryFileNames: "app.js",
        chunkFileNames: "app.js", 
        assetFileNames: "[name].[ext]",

        codeSplitting: false,
      },
    },
  },
});
