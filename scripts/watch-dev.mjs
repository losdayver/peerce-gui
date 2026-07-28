import { spawn } from "node:child_process";

const watcherScripts = ["watch:backend", "watch:frontend"];
const watchers = watcherScripts.map((script) =>
  process.platform === "win32"
    ? spawn("cmd.exe", ["/d", "/s", "/c", `npm run ${script}`], {
        stdio: "inherit",
      })
    : spawn("npm", ["run", script], { stdio: "inherit" })
);

let stopping = false;

function stopWatchers(exitCode) {
  if (stopping) return;

  stopping = true;
  for (const watcher of watchers) {
    if (watcher.killed || watcher.exitCode !== null) continue;

    if (process.platform === "win32" && watcher.pid) {
      spawn("taskkill", ["/pid", String(watcher.pid), "/t", "/f"], {
        stdio: "ignore",
        windowsHide: true,
      }).unref();
    } else {
      watcher.kill();
    }
  }

  process.exitCode = exitCode;
}

for (const watcher of watchers) {
  watcher.once("error", (error) => {
    console.error("Failed to start development watcher:", error);
    stopWatchers(1);
  });

  watcher.once("exit", (code, signal) => {
    if (stopping) return;

    console.error(
      `Development watcher stopped unexpectedly (${signal ?? `exit code ${code ?? 1}`}).`
    );
    stopWatchers(code ?? 1);
  });
}

process.once("SIGINT", () => stopWatchers(0));
process.once("SIGTERM", () => stopWatchers(0));
