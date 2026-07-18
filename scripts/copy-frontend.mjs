import { cp, mkdir } from "node:fs/promises";

await mkdir("dist/frontend", { recursive: true });
await cp("frontend/static/index.html", "frontend/dist/static/index.html");
await cp("frontend/static/styles.css", "frontend/dist/static/styles.css");

