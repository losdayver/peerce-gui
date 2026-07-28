import { mkdirSync, writeFileSync, existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { GlobalAppConfig } from "@commonTypes/app.js";

const globalAppConfigBase: GlobalAppConfig = {};

const homeConfigDir = join(homedir(), ".peerce-gui");
const configFileBaseName = "config.json";
const configFullPath = join(homeConfigDir, configFileBaseName);

mkdirSync(homeConfigDir, { recursive: true });
const exists = existsSync(configFullPath);
if (!exists)
  writeFileSync(configFullPath, JSON.stringify(globalAppConfigBase, null, 2));

export const getConfig = () => readFile(configFullPath);
export const saveConfig = (data: GlobalAppConfig) =>
  writeFile(configFullPath, JSON.stringify(data, null, 2));
