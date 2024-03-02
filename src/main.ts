import {checkAuthentication} from "./utils/authentication";
import errorHandler from "./utils/errorHandler";
import {setupListeners} from "./utils/eventsHandler";
import {startSession} from "./utils/session";

/**
 * Main function that initializes the application.
 * It checks if the user is authenticated with Firebase and starts the session.
 * @returns {Promise<void>} A promise that resolves when the main function completes.
 */
async function main() {
  try {
    // Check if the user is authenticated with Firebase
    await checkAuthentication();

    // Set up the listeners before starting the session
    setupListeners();
    // Start the session
    startSession();
  } catch (error) {
    errorHandler(error).then(() => process.exit(1));
  }
}
main();
