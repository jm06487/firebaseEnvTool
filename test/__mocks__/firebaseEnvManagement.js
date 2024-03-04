/**
 * Manages the Firebase environment configuration.
 * This module provides functions to generate a default configuration file,
 * prompt the user for the runtime config path, check authentication status,
 * start a session for environment variable management, unset environment variables,
 * set environment variables, and update the .runtimeconfig.json file.
 *
 * @module firebaseEnvManagement
 */

import fs from "fs";
import inquirer from "inquirer";
import {writeFile} from "fs/promises";
import {fileURLToPath} from "url";
import {dirname, resolve} from "path";
import shell from "shelljs";
import {spawn, exec} from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const configFilePath = resolve(__dirname, "config.json");

let config = {};

/**
 * Generates a configuration file with default values.
 * @returns {Object} The default configuration object.
 */
function generateConfigFile() {
  const defaultConfig = {
    runtimeConfigPath: "", // No default path provided
  };
  fs.writeFileSync(configFilePath, JSON.stringify(defaultConfig, null, 2));
  return defaultConfig;
}

// Check if config file exists, if not, generate one
if (fs.existsSync(configFilePath)) {
  config = JSON.parse(fs.readFileSync(configFilePath, "utf8"));
} else {
  console.log("Config file not found. Generating default config file...");
  config = generateConfigFile();
}

/**
 * Prompts the user to enter the path for the runtime config file.
 * Updates the config file with the provided path and starts the session.
 */
function promptForRuntimeConfigPath() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Enter the path for runtime config file:",
        name: "runtimeConfigPath",
      },
    ])
    .then(answers => {
      config.runtimeConfigPath = answers.runtimeConfigPath.trim(); // Remove extra spaces
      if (!config.runtimeConfigPath) {
        console.log("No path provided. Session will end.");
        process.exit();
      }
      // Write updated config to file
      writeFile(configFilePath, JSON.stringify(config, null, 2))
        .then(() => {
          console.log("Config file updated with runtime config path.");
          // Check authentication before starting the session
          checkAuthentication()
            .then(() => {
              console.log("Authentication successful. Starting session...");
              startSession();
            })
            .catch(error => {
              // Handle the error here
              console.error(error);
              console.log("Authentication failed. Please run 'firebase login --reauth'.");
              process.exit(1); // Exit with error code
            });
        })
        .catch(err => {
          console.error("Error updating config file:", err);
          process.exit(1); // Exit with error code
        });
    });
}

/**
 * Checks if the user is authenticated with Firebase.
 * @returns {Promise<void>} The Promise that resolves when the user is authenticated.
 */
async function checkAuthentication() {
  return new Promise((resolve, reject) => {
    const firebaseAuth = spawn("firebase", ["login:list"], {shell: true});

    firebaseAuth.stdout.on("data", data => {
      // Check if the output indicates that there are no authorized accounts
      if (data.toString().includes("No authorized accounts")) {
        handleAuthenticationError(
          "Failed to authenticate with Firebase. No authorized accounts found.",
        );
      } else {
        resolve();
      }
    });

    firebaseAuth.stderr.on("data", data => {
      reject(new Error(data.toString()));
    });

    firebaseAuth.on("close", code => {
      if (code !== 0) {
        handleAuthenticationError("Failed to authenticate with Firebase. An error occurred.");
      }
    });
  });
}

/**
 * Handles authentication errors and prompts the user to reauthenticate if chosen.
 * @param {string} errorMessage The error message to display.
 */
async function handleAuthenticationError(errorMessage) {
  console.error(errorMessage);

  const answers = await inquirer.prompt([
    {
      type: "confirm",
      name: "reauthenticate",
      message: "Do you want to reauthenticate with Firebase?",
      default: false,
    },
  ]);

  if (answers.reauthenticate) {
    console.log("Reauthenticating...");
    return new Promise((resolve, reject) => {
      const firebaseLogin = spawn("firebase", ["login", "--reauth"], {
        shell: true,
        stdio: "inherit",
      });

      firebaseLogin.on("close", code => {
        if (code === 0) {
          console.log("Firebase reauthentication successful.");
          // Retry authentication
          checkAuthentication()
            .then(() => {
              console.log("Authentication successful. Starting session...");
              startSession();
              resolve();
            })
            .catch(reject);
        } else {
          console.error("Firebase reauthentication failed. Please try again.");
          reject();
        }
      });
    });
  } else {
    console.log("Ending session...");
    process.exit(1);
  }
}

/**
 * Starts a session for environment variable management.
 */
function startSession() {
  inquirer
    .prompt([
      {
        type: "list",
        message: "What operation do you want to perform?",
        name: "operation",
        choices: ["Set environment variable", "Unset environment variable", "End session"],
      },
    ])
    .then(answers => {
      if (answers.operation === "Set environment variable") {
        setEnvVarPrompt();
      } else if (answers.operation === "Unset environment variable") {
        unsetEnvVarPrompt();
      } else if (answers.operation === "End session") {
        console.log("Session ended.");
        process.exit(); // Terminate the program when the session ends
      }
    })
    .catch(error => {
      console.error(error);
    });
}

/**
 * Prompts the user to set an environment variable and sets it using the Firebase CLI.
 * @returns {void}
 */
function setEnvVarPrompt() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Enter the name of the environment variable:",
        name: "envVarName",
      },
      {
        type: "input",
        message: "Enter the value of the environment variable:",
        name: "envVarValue",
      },
    ])
    .then(answers => {
      shell.exec(
        `firebase functions:config:set ${answers.envVarName}=${answers.envVarValue}`,
        (code, stdout, stderr) => {
          if (code !== 0) {
            if (stderr.includes("Authentication Error")) {
              handleAuthenticationError(
                "Your credentials are no longer valid. Please reauthenticate.",
              );
            } else {
              console.error("Error setting an environment variable:", stderr);
            }
            return;
          }
          console.log("Environment variable set successfully.");
          startSession(); // Return to the main menu
        },
      );
    })
    .catch(error => {
      console.error("An error occurred:", error);
      startSession(); // Return to the main menu
    });
}

/**
 * Prompts the user to select environment variables to unset and performs the unset operation.
 * If there is an error fetching the environment variables, it displays an error message and returns to the main menu.
 * @returns {void}
 */
function unsetEnvVarPrompt() {
  shell.exec("firebase functions:config:get", (code, stdout, stderr) => {
    if (code !== 0) {
      if (stderr.includes("Authentication Error")) {
        handleAuthenticationError("Your credentials are no longer valid. Please reauthenticate.");
        return;
      }
      console.error("Error fetching environment variables:", stderr);
      console.log("Retrying...");
      return unsetEnvVarPrompt();
    }

    const envVars = JSON.parse(stdout);
    const envVarNames = Object.keys(envVars);

    inquirer
      .prompt([
        {
          type: "checkbox",
          message: "Select environment variables to unset",
          name: "selectedNames",
          choices: envVarNames,
          validate: function(answer) {
            if (answer.length < 1) {
              return "You must choose at least one environment variable.";
            }
            return true;
          },
        },
      ])
      .then(answers => {
        Promise.all(answers.selectedNames.map(unsetEnvVar)).then(() => startSession());
      })
      .catch(error => {
        console.error("An error occurred:", error);
        startSession(); // Return to the main menu
      });
  });
}

/**
 * Updates the runtime configuration.
 * @returns {Promise<void>} The Promise that resolves when the configuration is updated.
 */
async function updateRuntimeConfig() {
  try {
    // Get current config
    const get = spawn("firebase", ["functions", "config", "get"], {shell: true});

    get.stdout.on("data", data => {
      console.log(`stdout: ${data}`);
    });

    get.stderr.on("data", data => {
      console.error(`stderr: ${data}`);
    });

    get.on("error", error => {
      console.error(`error: ${error.message}`);
    });

    get.on("close", code => {
      if (code !== 0) {
        console.error(`Failed to get current config. Exit code: ${code}`);
        console.log("Ending session...");
        process.exit(1);
      }
    });
  } catch (error) {
    console.error(`Failed to get current config: ${error}`);
  }
}

/**
 * Main function that handles the execution flow.
 * If `config.runtimeConfigPath` is not defined, prompts the user for the runtime config path.
 * Otherwise, starts the session.
 * @returns {Promise<void>} A promise that resolves when the execution is complete.
 */
export async function main() {
  try {
    // Check authentication before proceeding
    await checkAuthentication();

    if (!config.runtimeConfigPath) {
      await promptForRuntimeConfigPath();
    } else {
      // Start the session
      await checkAuthentication()
        .then(() => {
          console.log("Authentication successful. Starting session...");
          startSession();
        })
        .catch(error => {
          console.error(error);
          console.log("Authentication failed. Please run 'firebase login --reauth'.");
          process.exit(1); // Exit with error code
        });
    }
  } catch (error) {
    console.error(error);
    console.log("Authentication failed. Please run 'firebase login --reauth'.");
    process.exit(1); // Exit with error code
  }
}

// Call the main function to start the program
main().catch(error => {
  console.error(error);
});
