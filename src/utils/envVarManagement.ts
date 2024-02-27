import inquirer from "inquirer";
import shell from "shelljs";

import {RESERVED_KEYS} from "../config/reservedKeys";
import {handleAuthenticationError} from "./authentication";
import {startSession} from "./session";

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
      shell.exec(
        `firebase functions:config:set ${answers.envVarName}=${answers.envVarValue}`,
        (code: number, stdout: string, stderr: string) => {
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
    .catch((error) => {
      console.error("An error occurred:", error);
      startSession(); // Return to the main menu
    });
}

/**
 * Prompts the user to select environment variables to unset and performs the unset operation.
 * If there is an error fetching the environment variables, it displays an error message and returns to the main menu.
 * @returns {void}
 */
export function unsetEnvVarPrompt() {
  shell.exec("firebase functions:config:get", (code: number, stdout: string, stderr: string) => {
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
          validate: function (answer) {
            if (answer.length < 1) {
              return "You must choose at least one environment variable.";
            }
            return true;
          },
        },
      ])
      .then((answers) => {
        Promise.all(answers.selectedNames.map(unsetEnvVar)).then(() => startSession());
      })
      .catch((error) => {
        console.error("An error occurred:", error);
        startSession(); // Return to the main menu
      });
  });
}
