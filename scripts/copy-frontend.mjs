import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/frontend/static", { recursive: true });
await cp("frontend/static", "dist/frontend/static", { recursive: true });
