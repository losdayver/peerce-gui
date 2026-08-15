import { GlobalAppConfig } from "@commonTypes/app.js";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const globalAppConfigBase: GlobalAppConfig = {
  encrypt: true,
};

export const homeDirFolderName = ".peerce-gui";
export const peerceHomeDirFolderName = ".peerce";
export const appHomeDir = join(homedir(), homeDirFolderName);
export const peerceHomeDir = join(homedir(), peerceHomeDirFolderName);

const configFileBaseName = "config.json";
const configFullPath = join(appHomeDir, configFileBaseName);

mkdirSync(appHomeDir, { recursive: true });
mkdirSync(peerceHomeDir, { recursive: true });
const exists = existsSync(configFullPath);
if (!exists)
  writeFileSync(configFullPath, JSON.stringify(globalAppConfigBase, null, 2));

export const getConfig = async () =>
  JSON.parse((await readFile(configFullPath)).toString()) as GlobalAppConfig;
export const saveConfig = (data: GlobalAppConfig) =>
  writeFile(configFullPath, JSON.stringify(data, null, 2));
