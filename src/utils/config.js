import fs from "fs";
import os from "os";
import {writeFile} from "fs/promises";
import {fileURLToPath} from "url";
import {dirname, resolve, join} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let configDir;
if (os.platform() === "win32") {
  // For Windows
  configDir = join(os.homedir(), "AppData", "Roaming", "firebase-env-cli");
} else {
  // For Unix-like systems
  configDir = join(os.homedir(), ".firebase-env-cli");
}

// Ensure the configuration directory exists
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, {recursive: true});
}

const configFilePath = join(configDir, "config.json");

let config = {};

function generateConfigFile() {
  const defaultConfig = {
    runtimeConfigPath: "", // No default path provided
  };
  fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
}

if (fs.existsSync(configFilePath)) {
  config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
} else {
  console.log("Config file not found. Generating default config file...");
  config = generateConfigFile();
}

export {config, generateConfigFile};
