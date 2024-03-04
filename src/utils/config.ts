// config.ts

import * as fs from "fs";
import * as os from "os";
import {join} from "path";
import inquirer from "inquirer";
import {USER_CONFIG_OPTIONS} from "../config/cliConfigOptions";
import errorHandler from "./errorHandler";

import {state} from "./state";
import eventEmitter from "./events";

/**
 * Determines the appropriate configuration directory based on the operating system.
 * For Windows, it uses the AppData/Roaming directory. For macOS, it uses the home directory.
 * For other Unix-like systems and Windows Server, it uses the home directory as well.
 * Ensures that the configuration directory exists.
 * @returns {string} The path to the configuration directory.
 */
function getConfigDirectory() {
  let configDir = join(os.homedir(), ".firebase-env-cli"); // Default value

  try {
    if (os.platform() === "win32") {
      // For Windows and Windows Server
      configDir = join(os.homedir(), "AppData", "Roaming", "firebase-env-cli");
    } else if (os.platform() === "darwin") {
      // For macOS
      configDir = join(os.homedir(), ".firebase-env-cli");
    }

    // Ensure the configuration directory exists
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, {recursive: true});
    }
  } catch (error) {
    errorHandler(error)
      .then(() => {
        // code to run after errorHandler has finished
      })
      .catch((err) => {
        // handle any errors that occurred in errorHandler or the then block
      });
  }

  return configDir;
}

/**
 * Generates a configuration file with default values.
 * @param {string} configFilePath - The path to the configuration file.
 * @returns {Object} The default configuration object.
 */
export async function generateConfigFile(configFilePath: string) {
  console.log("Inside generateConfigFile function"); // Debugging log

  const questions = Object.entries(USER_CONFIG_OPTIONS).map(([key, value]) => ({
    type: value.type,
    name: key,
    message: value.message,
    default: value.default,
    choices: value.choices,
    when: value.required instanceof Function ? value.required : () => !value.required,
  }));

  try {
    console.log("Before inquirer.prompt"); // Debugging log
    const answers = await inquirer.prompt(questions);
    console.log("After inquirer.prompt"); // Debugging log

    fs.writeFileSync(configFilePath, JSON.stringify(answers, null, 2));
    return answers;
  } catch (error) {
    errorHandler(error).then(() => process.exit(1));
  }
}

/**
 * Read and parse the configuration file if it exists, otherwise generate a default configuration file.
 * @param {string} configFilePath - The path to the configuration file.
 * @returns {Object} The configuration object.
 */

export function readConfig(configFilePath: string) {
  let config;
  try {
    if (fs.existsSync(configFilePath)) {
      // Configuration file exists, read and parse it
      config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));

      // Check if the available options in the config file are up-to-date
      if (JSON.stringify(config.USER_CONFIG_OPTIONS) !== JSON.stringify(USER_CONFIG_OPTIONS)) {
        // Update the available options in the config file
        config.USER_CONFIG_OPTIONS = USER_CONFIG_OPTIONS;
        fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
      }
    } else {
      // Configuration file not found, generate default config file
      console.log("Config file not found. Generating default config file...");
      config = generateConfigFile(configFilePath);
    }
    return config;
  } catch (error) {
    errorHandler(error).then(() => process.exit(1));
  }
}

// Function to prompt user for editing config
export async function editConfigPrompt() {
  // Get the keys of the config object
  const configKeys = Object.keys(state.config);

  try {
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "configOption",
        message: "Select the config option you want to edit:",
        choices: [...configKeys, "Enable an option", "Disable an option", "Return to main menu"],
      },
    ]);

    if (answers.configOption === "Enable an option") {
      eventEmitter.emit("enableConfigOption");
    } else if (answers.configOption === "Disable an option") {
      eventEmitter.emit("disableConfigOption");
    } else if (answers.configOption === "Return to main menu") {
      eventEmitter.emit("startSession"); // Return to the main menu
    }
  } catch (error) {
    await errorHandler(error);
    process.exit(1);
  }
}

/**
 * Function to disable a config option
 */
export async function disableConfigOption() {
  console.log("disableConfigOption called");

  const configKeys = Object.keys(state.config) as (keyof typeof state.config)[];

  try {
    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "configOption",
        message: "Select the config option you want to disable:",
        choices: configKeys,
      },
    ]);

    // Set the selected config option to undefined
    state.config[answers.configOption] = undefined;

    // Log the updated state for debugging purposes
    console.log("After disabling:", state.config);

    const configFilePath = "../../tests/config.json"; // Replace with actual path
    fs.writeFileSync(configFilePath, JSON.stringify(state.config, null, 2));

    console.log("Config option disabled successfully.");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}
