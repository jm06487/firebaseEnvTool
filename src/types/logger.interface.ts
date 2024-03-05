export interface LoggerInstance {
  /**
   * Logs a message at the debug level.
   * @param message The message to be logged.
   */
  debug(message: string): void;

  /**
   * Logs a message at the info level.
   * @param message The message to be logged.
   */
  info(message: string): void;

  /**
   * Logs a message at the warn level.
   * @param message The message to be logged.
   */
  warn(message: string): void;

  /**
   * Logs a message at the error level.
   * @param message The message to be logged.
   */
  error(message: string): void;
}
export interface LoggerConfig {
  filePath: string;
  level: string;
  // Add more options as needed
}
