import { copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";

const requiredNodeMajor = 22;
const currentNodeMajor = Number.parseInt(process.versions.node, 10);

if (process.platform !== "win32") {
  throw new Error("The bundled Node.js runtime is currently configured for Windows only.");
}

if (currentNodeMajor !== requiredNodeMajor) {
  throw new Error(
    `Expected Node.js ${requiredNodeMajor}.x for the bundled runtime, received ${process.versions.node}.`
  );
}

const runtimeDirectory = join("dist", "runtime");
const nodeDirectory = dirname(process.execPath);
const nodeLicensePath = join(nodeDirectory, "LICENSE");

await mkdir(runtimeDirectory, { recursive: true });
await Promise.all([
  copyFile(process.execPath, join(runtimeDirectory, "node.exe")),
  copyFile(nodeLicensePath, join(runtimeDirectory, "node-LICENSE")),
]);

console.log(`Prepared bundled Node.js runtime ${process.versions.node}.`);
