import fs from "fs";
import os from "os";
import {join} from "path";
import inquirer from "inquirer";
import errorHandler from "./errorHandler";
import {startSession} from "./session";
import {USER_CONFIG_OPTIONS} from "src/config/cliConfigOptions";

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
async function generateConfigFile(configFilePath: string) {
  const questions = Object.entries(USER_CONFIG_OPTIONS).map(([key, value]) => ({
    type: value.type,
    name: key,
    message: value.message,
    default: value.default,
    choices: value.choices,
    when: value.required instanceof Function ? value.required : () => !value.required,
  }));

  try {
    const answers = await inquirer.prompt(questions);
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
function readConfig(configFilePath: string) {
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
function editConfigPrompt() {
  // Get the keys of the config object
  const configKeys = Object.keys(config);

  inquirer
    .prompt([
      {
        type: "list",
        name: "configOption",
        message: "Select the config option you want to edit:",
        choices: [...configKeys, "Enable an option", "Disable an option", "Return to main menu"],
      },
    ])
    .then((answers) => {
      if (answers.configOption === "Enable an option") {
        enableConfigOption();
      } else if (answers.configOption === "Disable an option") {
        disableConfigOption();
      } else if (answers.configOption === "Return to main menu") {
        startSession(); // Start a new session
      }
    })
    .catch((error) => {
      errorHandler(error).then(() => process.exit(1));
    });
}

function enableConfigOption() {
  // Filter out the options that are already in the config
  const optionsToAdd = Object.keys(USER_CONFIG_OPTIONS).filter(
    (option) => !config.hasOwnProperty(option),
  );

  inquirer
    .prompt([
      {
        type: "list",
        name: "key",
        message: "Select the config option you want to enable:",
        choices: optionsToAdd,
      },
    ])
    .then((answers) => {
      const optionPrompt = USER_CONFIG_OPTIONS[answers.key];
      inquirer
        .prompt([
          {
            ...optionPrompt,
            name: "value",
          },
        ])
        .then((optionAnswers) => {
          // Add the new option to the config object
          config[answers.key] = optionAnswers.value;

          // Write the updated config object to the config file
          fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

          console.log("Config option enabled successfully.");
          editConfigPrompt(); // Return to the main menu
        })
        .catch((error) => {
          errorHandler(error).then(() => process.exit(1));
        });
    })
    .catch((error) => {
      errorHandler(error).then(() => process.exit(1));
    });
}

function disableConfigOption() {
  // Get the keys of the config object
  const configKeys = Object.keys(config);

  inquirer
    .prompt([
      {
        type: "list",
        name: "configOption",
        message: "Select the config option you want to disable:",
        choices: configKeys,
      },
    ])
    .then((answers) => {
      // Delete the selected option from the config object
      delete config[answers.configOption];

      // Write the updated config object to the config file
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));

      console.log("Config option disabled successfully.");
      editConfigPrompt(); // Return to the main menu
    })
    .catch((error) => {
      errorHandler(error).then(() => process.exit(1));
    });
}

// Other functions for editing config...

// Get the configuration directory
const configDir = getConfigDirectory();
// File path for the config.json file
const configFilePath = join(configDir, "config.json");
// Read the configuration file
const config = readConfig(configFilePath);

// Export the editConfigPrompt function along with other functions
export {config, getConfigDirectory, generateConfigFile, readConfig, editConfigPrompt};
