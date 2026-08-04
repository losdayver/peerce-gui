import { defineConfig } from "vite";

export default defineConfig({
  build: {
    ssr: "backend/src/server.ts",
    outDir: "dist/backend",
    target: "node22",
    minify: false,
  },
  ssr: {
    target: "node",
    noExternal: true,
  },
});
