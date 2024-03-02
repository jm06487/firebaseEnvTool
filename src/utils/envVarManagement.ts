import inquirer from "inquirer";
import {spawn} from "child_process";

import {RESERVED_KEYS} from "../config/reservedKeys";
import {handleAuthenticationError} from "./authentication";
import errorHandler from "./errorHandler";
import eventEmitter from "./events";

/**
 * Prompts the user to set an environment variable and sets it using the Firebase CLI.
 * @returns {void}
 */
export function setEnvVarPrompt() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Enter the name of the environment variable:",
        name: "envVarName",
        validate: function (input) {
          if (
            RESERVED_KEYS.includes(input.toUpperCase()) ||
            input.startsWith("X_GOOGLE_") ||
            input.startsWith("EXT_") ||
            input.startsWith("FIREBASE_")
          ) {
            return "This key is reserved for internal use. Please enter a different key.";
          }
          return true;
        },
      },
      {
        type: "input",
        message: "Enter the value of the environment variable:",
        name: "envVarValue",
      },
    ])
    .then((answers) => {
      const firebaseCommand = spawn("firebase", [
        "functions:config:set",
        `${answers.envVarName}=${answers.envVarValue}`,
      ]);

      firebaseCommand.stdout.on("data", (data) => {
        console.log(`stdout: ${data}`);
      });

      firebaseCommand.stderr.on("data", (data) => {
        const stderr = data.toString();
        if (stderr.includes("Authentication Error")) {
          handleAuthenticationError("Your credentials are no longer valid. Please reauthenticate.");
        } else {
          console.error("Error setting an environment variable:", stderr);
        }
      });

      firebaseCommand.on("close", (code) => {
        if (code === 0) {
          console.log("Environment variable set successfully.");
          eventEmitter.emit("startSession"); // Return to the main menu
        }
      });
    })
    .catch((error) => {
      console.error("An error occurred:", error);
      eventEmitter.emit("startSession"); // Return to the main menu
    });
}

export function unsetEnvVar(name: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const firebaseCommand = spawn("firebase", ["functions:config:unset", name]);

    firebaseCommand.stdout.on("data", (data) => {
      console.log(`stdout: ${data}`);
    });

    firebaseCommand.stderr.on("data", (data) => {
      const stderr = data.toString();
      if (stderr) {
        errorHandler(new Error(stderr));
      }
    });

    firebaseCommand.on("close", (code) => {
      if (code === 0) {
        console.log(`Environment variable ${name} unset successfully.`);
        resolve();
      } else {
        reject(new Error(`Failed to unset environment variable ${name}`));
      }
    });
  });
}

/**
 * Prompts the user to select environment variables to unset and performs the unset operation.
 * If there is an error fetching the environment variables, it displays an error message and returns to the main menu.
 * @returns {void}
 */
export function unsetEnvVarPrompt() {
  const firebaseCommand = spawn("firebase", ["functions:config:get"]);

  firebaseCommand.stdout.on("data", (data) => {
    const stdout = data.toString();
    const envVars = JSON.parse(stdout);
    const envVarNames = Object.keys(envVars);

    inquirer
      .prompt([
        {
          type: "checkbox",
          message: "Select environment variables to unset",
          name: "selectedNames",
          choices: envVarNames,
          validate: function (answer) {
            if (answer.length < 1) {
              return "You must choose at least one environment variable.";
            }
            return true;
          },
        },
      ])
      .then((answers) => {
        Promise.all(
          answers.selectedNames.map((name: string) => eventEmitter.emit("unsetEnvVar", name)),
        ).then(() => eventEmitter.emit("startSession"));
      })
      .catch((error) => {
        console.error("An error occurred:", error);
        eventEmitter.emit("startSession"); // Return to the main menu
      });
  });

  firebaseCommand.stderr.on("data", (data) => {
    const stderr = data.toString();
    if (stderr.includes("Authentication Error")) {
      handleAuthenticationError("Your credentials are no longer valid. Please reauthenticate.");
    } else {
      console.error("Error fetching environment variables:", stderr);
      console.log("Retrying...");
      eventEmitter.emit("unsetEnvVarPrompt");
    }
  });
}
