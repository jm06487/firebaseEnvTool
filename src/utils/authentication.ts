import {spawn} from "child_process";
import inquirer from "inquirer";

/**
 * Handles authentication error.
 * @param {string} errorMessage - The error message.
 * @returns {Promise<void>} - A promise that resolves when the authentication is handled.
 */
async function handleAuthenticationError(errorMessage: string) {
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
    return checkAuthentication();
  } else {
    console.log("Ending session...");
    process.exit(1);
  }
}

/**
 * Checks if the user is authenticated with Firebase.
 * @returns {Promise<void>} A promise that resolves if the user is authenticated, or rejects with an error if authentication fails.
 */
async function checkAuthentication() {
  return new Promise<void>((resolve, reject) => {
    console.log("Checking authentication...");
    const firebaseAuth = spawn("firebase", ["login:list"], {shell: true});

    firebaseAuth.stdout.on("data", (data) => {
      if (data.toString().includes("No authorized accounts")) {
        handleAuthenticationError(
          "Failed to authenticate with Firebase. No authorized accounts found.",
        );
      } else {
        resolve();
      }
    });

    firebaseAuth.stderr.on("data", (data) => {
      reject(new Error(data.toString()));
    });

    firebaseAuth.on("close", (code) => {
      if (code !== 0) {
        handleAuthenticationError("Failed to authenticate with Firebase. An error occurred.");
      }
    });
  });
}

export {checkAuthentication, handleAuthenticationError};
