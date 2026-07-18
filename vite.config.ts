import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  root: path.resolve(__dirname, "frontend"),
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
