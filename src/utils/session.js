import inquirer from "inquirer";
import {handleAuthenticationError} from "./authentication.js";

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
export {startSession};
