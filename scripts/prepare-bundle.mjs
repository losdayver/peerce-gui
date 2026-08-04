import { chmod, copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const requiredNodeMajor = 22;
const currentNodeMajor = Number.parseInt(process.versions.node, 10);

if (process.platform !== "win32" && process.platform !== "linux") {
  throw new Error(`Unsupported bundle platform: ${process.platform}.`);
}

if (currentNodeMajor !== requiredNodeMajor) {
  throw new Error(
    `Expected Node.js ${requiredNodeMajor}.x for the bundled runtime, received ${process.versions.node}.`
  );
}

const runtimeDirectory = join("dist", "runtime");
const nodeDirectory = dirname(process.execPath);
const nodeFileName = process.platform === "win32" ? "node.exe" : "node";
const nodeLicensePath = join(
  nodeDirectory,
  process.platform === "win32" ? "LICENSE" : "../LICENSE"
);
const bundledNodePath = join(runtimeDirectory, nodeFileName);

await mkdir(runtimeDirectory, { recursive: true });
await Promise.all([
  copyFile(process.execPath, bundledNodePath),
  copyFile(nodeLicensePath, join(runtimeDirectory, "node-LICENSE")),
]);

if (process.platform === "linux") await chmod(bundledNodePath, 0o755);

console.log(`Prepared bundled Node.js runtime ${process.versions.node}.`);
