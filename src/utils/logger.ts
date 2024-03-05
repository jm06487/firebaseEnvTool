import * as fs from "fs";
import * as path from "path";
import {createLogger, transports, format, log} from "winston"; // Install Winston dependency: npm install winston
import {LoggerConfig} from "../types/logger.interface";

/**
 * Debug logger instance for internal debugging messages.
 */
const debugLogger = createLogger({
  level: "debug",
  format: format.combine(
    format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}), // Correct usage
    format.printf(({level, message, timestamp}) => {
      return `[${level}] ${timestamp} - ${message}`;
    }),
  ),
  transports: [new transports.Console()],
});
/**
 * Logs a debug message to the debug logger.
 *
 * @param {string} message The message to be logged.
 */
function logDebug(message: string): void {
  debugLogger.debug(message);
}

/**
 * Represents a logger utility for writing log messages to a file.
 *
 * Implements a singleton pattern to ensure only one instance exists
 * per unique log file path.
 */
class Logger {
  private static instances: Record<string, Logger> = {};
  private logStream!: fs.WriteStream;
  private writeQueue: string[] = [];
  private isWriting = false;
  private static readonly defaultConfig: LoggerConfig = {
    filePath: "logs/session.log",
    level: "info",
  };

  /**
   * Creates a new Logger instance for the specified log file path.
   *
   * @param {string} filePath The path to the log file.
   */
  constructor(private filePath: string) {
    ////  logDebug(`setting log file path ${filePath}`);
    this.setLogFilePath(filePath);
  }

  private static getInstance(logFilePath: string) {
    const safePath = path.resolve(path.normalize(logFilePath));
    if (!Logger.instances[safePath]) {
      Logger.instances[safePath] = new Logger(safePath);
    }
    return Logger.instances[safePath];
  }

  /**
   * Sets the log file path and attempts to create the file and directory if necessary.
   *
   * @private
   * @param {string} logFilePath The path to the log file.
   */
  private setLogFilePath(logFilePath: string) {
    try {
      const safePath = path.resolve(path.normalize(logFilePath));
      //// logDebug(`Creating log file at: ${safePath}`); // Debugging statement
      fs.mkdirSync(path.dirname(safePath), {recursive: true});
      ////  logDebug(`Log file directory created at: ${path.dirname(safePath)}`); // Debugging statement
      this.logStream = fs.createWriteStream(safePath, {flags: "a"});
      //// logDebug(`Log file created at: ${safePath}`); // Debugging statement
    } catch (error) {
      //// logDebug(`Error creating log file: ${error}`); // Debugging statement
      Logger.logError(`Error creating log file: ${error}`);
    }
  }

  /**
   * Asynchronously writes a message to the log file queue and then flushes the queue to the file.
   *
   * @private
   * @param {string} message The message to be logged.
   * @returns {Promise<void>} A promise that resolves when the message is written to the file.
   */
  private async writeToFile(message: string): Promise<void> {
    // Add the message to the queue
    this.writeQueue.push(message);

    // If not already writing, start writing the queue contents
    if (!this.isWriting) {
      this.isWriting = true;
      while (this.writeQueue.length > 0) {
        // Retrieve the next message from the queue
        const message = this.writeQueue.shift()!;

        // Create a timestamp for the message
        const timestamp = new Date().toISOString();

        // Write the message with timestamp to the log file stream
        // - Use a promise to handle the asynchronous write operation
        await new Promise((resolve, reject) => {
          this.logStream.write(`[${timestamp}] ${message}\n`, (err) => {
            if (err) {
              // Reject the promise if an error occurs during writing

              reject(err);
            } else {
              // Resolve the promise on successful write
              resolve(null);
            }
          });
        });
      }

      // Mark writing as completed after finishing the queue
      this.isWriting = false;
    }
  }

  /**
   * Logs a message asynchronously to the specified log file, appending a newline character at the end.
   *
   * @private
   * @param {string} message The message to be logged.
   * @param {string} [logDir="logs"] The directory path for the error log file (optional).
   * @returns {Promise<void>} A promise that resolves when the message is successfully logged to the file,
   *                         or rejects if an error occurs during writing.
   */
  private async logMessage(message: string, logDir?: string): Promise<void> {
    try {
      // Ensure newline character is present at the end of the message
      await this.writeToFile(message + "\n"); // Append newline for line breaks

      // Resolve the promise if writing is successful
      return Promise.resolve();
    } catch (error) {
      const errorMessage: string = (error as Error).message; // Assert error to be of type Error
      // Log the error to the error log file

      Logger.logError(errorMessage, logDir);

      // Consider additional error handling strategies as needed
      // (e.g., retry logic, notification mechanisms, custom error handling)

      // Reject the promise to signal the error
      return Promise.reject(error);
    }
  }

  /**
   * Logs a message to the specified log file and automatically closes the log stream afterwards.
   *
   * @public
   * @static
   * @param {string} message The message to be logged.
   * @param {string} [logFilePath="logs/session.log"] The path to the log file. (Default: "logs/session.log")
   * @returns {Promise<void>} A promise that resolves when the message is logged and the log stream is closed,
   *                         or rejects on error.
   */
  static async log(message: string, filePath: string): Promise<void> {
    const logger = Logger.getInstance(filePath);
    logDebug(`Calling logMessage with: ${filePath}`);

    await logger.logMessage(message);
    try {
      await Logger.end(); // Close the stream after async writing
    } catch (error) {
      Logger.logError(`Error closing log file: ${error}`);
    }
  }

  static end(logFilePath: string = "logs/session.log") {
    logDebug(`Calling end with: ${logFilePath}`); // Debugging statement
    const logger = Logger.getInstance(logFilePath);
    try {
      logger.logStream.end();
      logDebug(`Log file closed at: ${logFilePath}`); // Debugging statement
    } catch (error) {
      logDebug(`Error closing log file: ${error}`); // Debugging statement
      Logger.logError(`Error closing log file: ${error}`);
    }
  }

  /**
   * Logs an error message to a separate "error.log" file or a custom error log file if provided.
   *
   * @static
   * @param {string} errorMessage The error message to be logged.
   * @param {string} [logDir="logs"] The directory path for the error log file (optional).
   *                      If not provided, logs to the default "logs/error.log" file.
   */
  static logError(errorMessage: string, logDir?: string): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] ${errorMessage}\n`; // Add timestamp and newline

    const errorLogPath = logDir ? path.join(process.cwd(), logDir, "error.log") : "logs/error.log";
    fs.appendFileSync(errorLogPath, formattedMessage); // Append formatted message
  }
}

export default Logger;
