import {afterEach, describe, expect, it, test, vi} from "vitest";
import fs from "fs";
import path from "path";
import Logger from "../src/utils/logger";

describe("Logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("should write log messages to the specified file", async () => {
    const message = "Test log message";
    const safePath = path.join(__dirname, "../test-logs/test.log");

    // Create a spy for Logger.log
    const logSpy = vi.spyOn(Logger, "log");

    await Logger.log(message, safePath);

    // Check if the spy was called with the correct arguments
    expect(logSpy).toHaveBeenCalledWith(message, safePath);

    // Promise-based check for file existence
    await new Promise<void>((resolve, reject) => {
      fs.access(safePath, fs.constants.F_OK, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Check if log file exists
    const fileExists = fs.existsSync(safePath);
    expect(fileExists).toBe(true);

    // Read log file content
    const logContent = fs.readFileSync(safePath, "utf-8");
    expect(logContent).toContain(message);
  });

  test("Should handle errors when writting to a specified file.", async () => {
    const logMessage = "Test log message";
    const logFilePath = path.join(process.cwd(), "test-logs", "test.log");
    const config = {filePath: logFilePath, level: "info"};

    // Spy on Logger.log and Logger.end
    const logSpy = vi.spyOn(Logger, "log");
    const endSpy = vi.spyOn(Logger, "end");

    await Logger.log(logMessage, logFilePath);

    // Check if Logger.log and Logger.end were called
    expect(logSpy.mock.calls.length).toBe(1);
    expect(endSpy.mock.calls.length).toBe(1);

    // Check if Logger.log was called with the correct arguments
    expect(logSpy.mock.calls[0][0]).toBe(logMessage);

    // Restore the original methods
    logSpy.mockRestore();
    endSpy.mockRestore();
  });

  test("should handle errors when closing log file", async () => {
    // Log messages using vi.mock().mockImplementation()
    // vi.spyOn(console, "log").mockImplementation((message) => {
    //   console.log(message); // Actual output to the terminal
    // });

    const error = new Error("Test error");
    const endStub = vi.spyOn(fs.WriteStream.prototype, "end").mockImplementationOnce(() => {
      throw error; // Throw the error once during the first call
    });
    const logErrorStub = vi.spyOn(Logger, "logError");

    await Logger.end(); // Call Logger.end asynchronously for reliable mocking

    expect(endStub).toHaveBeenCalled(); // Expect the mocked end method to be called
    expect(logErrorStub).toHaveBeenCalledWith(`Error closing log file: ${error}`); // Verify error message logging
  });

  it("should handle errors when closing log file", () => {
    const error = new Error("Test error");
    const endStub = vi.spyOn(fs.WriteStream.prototype, "end").mockImplementation(() => {
      throw error;
    });
    const logErrorStub = vi.spyOn(Logger, "logError");
    Logger.end();
    expect(endStub).toHaveBeenCalled();
    expect(logErrorStub).toHaveBeenCalledWith(`Error closing log file: ${error}`);
  });

  it("should log error messages to a separate error log file", () => {
    const errorMessage = "Test error message";
    Logger.logError(errorMessage);
    expect(fs.existsSync("logs/error.log")).toBe(true);
    const errorLogContent = fs.readFileSync("logs/error.log", "utf-8");
    expect(errorLogContent).toContain(errorMessage);
  });
});
