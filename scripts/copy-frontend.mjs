import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/frontend", { recursive: true });
await cp("frontend/static/index.html", "dist/frontend/static/index.html");
await cp("frontend/static/styles.css", "dist/frontend/static/styles.css");

