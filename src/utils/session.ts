import inquirer from "inquirer";
import errorHandler from "./errorHandler";
import eventEmitter from "./events";
import Logger from "./logger";

/**
 * Starts a session for environment variable management.
 */
export function startSession() {
  Logger.log("Session started.");
  inquirer
    .prompt([
      {
        type: "list",
        message: "What operation do you want to perform?",
        name: "operation",
        choices: [
          "Set environment variable",
          "Unset environment variable",
          "Edit firebase-env-cli config",
          "End session",
        ],
      },
    ])
    .then((answers) => {
      if (answers.operation === "Set environment variable") {
        eventEmitter.emit("setEnvVarPrompt");
      } else if (answers.operation === "Unset environment variable") {
        eventEmitter.emit("unsetEnvVarPrompt");
      } else if (answers.operation === "Edit firebase-env-cli config") {
        eventEmitter.emit("editConfigPrompt"); // Emit the editConfigPrompt event
      } else if (answers.operation === "End session") {
        eventEmitter.emit("endSession"); // Terminate the program when the session ends
      }
    })
    .catch((error) => {
      errorHandler(error);
      process.exit(1);
    });
}
