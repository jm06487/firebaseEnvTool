import {spawn} from "child_process";
import inquirer from "inquirer";

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
    return checkAuthentication();
  } else {
    console.log("Ending session...");
    process.exit(1);
  }
}

async function checkAuthentication() {
  return new Promise((resolve, reject) => {
    const firebaseAuth = spawn("firebase", ["login:list"], {shell: true});

    firebaseAuth.stdout.on("data", data => {
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

export {checkAuthentication, handleAuthenticationError};
