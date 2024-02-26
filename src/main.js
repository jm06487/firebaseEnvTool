import {config, generateConfigFile} from "./utils/config.js";
import {checkAuthentication} from "./utils/authentication.js";
import {startSession} from "./utils/session.js";

/**
 * Main function that initializes the application.
 * It checks if the user is authenticated with Firebase and starts the session.
 * @returns {Promise<void>} A promise that resolves when the main function completes.
 */
async function main() {
  try {
    // Check if the user is authenticated with Firebase
    await checkAuthentication();

    // Start the session
    startSession();
  } catch (error) {
    console.error("An error occurred:", error.message);
    process.exit(1);
  }
}
main();
