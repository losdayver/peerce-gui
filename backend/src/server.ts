import {
  createReadStream,
  createWriteStream,
  existsSync,
  statSync,
} from "node:fs";
import { createServer, type ServerResponse } from "node:http";
import { extname, join, resolve } from "node:path";
import { WebSocketServer } from "ws";
import { WssRouter } from "./wssRouter.js";
import * as config from "./configProvider.js";
import { init, migrate } from "./db/initAndMigrate.js";
import { appHomeDir } from "./configProvider.js";
config;

init();
migrate();

const logStream = createWriteStream(join(appHomeDir, "backend.log"), {
  flags: "a",
});
process.stdout.write = logStream.write.bind(logStream);
process.stderr.write = logStream.write.bind(logStream);

const host = "127.0.0.1";
const port = 4310;
const distRoot = resolve("dist/frontend");

const mimeTypes: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = createServer((request, response) => {
  const pathname = new URL(request.url ?? "/", `http://${host}:${port}`)
    .pathname;

  allowFrontend(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (request.method === "GET" && pathname === "/api/health") {
    response.writeHead(200);
    response.end();
    return;
  }

  sendFrontend(pathname, response);
});

const wss = new WebSocketServer({ server });
new WssRouter(wss);

function allowFrontend(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
}

/** Files handler */
function sendFrontend(pathname: string, response: ServerResponse): void {
  const requestedPath = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = join(distRoot, requestedPath);

  if (
    !filePath.startsWith(distRoot) ||
    !existsSync(filePath) ||
    !statSync(filePath).isFile()
  ) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] ?? "application/octet-stream",
  });
  createReadStream(filePath).pipe(response);
}

server.listen(port, host, () => {
  console.log(`Node.js backend: http://${host}:${port}`);
});

function shutdown(): void {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
