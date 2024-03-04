import {afterEach, beforeEach, describe, expect, it, test, vi} from "vitest";
import fs from "fs";
import path from "path";
import Logger from "../src/utils/logger";
import {exec} from "shelljs";

describe("Logger", () => {
  const logFilePath = "test-logs/test.log";

  beforeEach(() => {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
  });

  afterEach(() => {
    Logger.end();
    vi.restoreAllMocks();
  });

  it("should create a log file and write log messages", async () => {
    const message = "Test log message";

    // Validate logFilePath
    if (!/^[\w-]+\.log$/.test(path.basename(logFilePath))) {
      throw new Error("Invalid log file path");
    }

    const safePath = path.resolve(path.normalize(logFilePath));
    const dir = path.dirname(safePath);

    console.log(`Writing log to: ${safePath}`);
    Logger.log(message, safePath);
    // Add a delay to give Logger time to write the message to the file
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Checking if log file exists...");
    const fileExists = await fs.existsSync(safePath);
    console.log(`File exists: ${fileExists}`);
    expect(fileExists).toBe(true);

    console.log("Reading log file content...");
    const logContent = fs.readFileSync(safePath, "utf-8");
    console.log(`Log content: ${logContent}`);
    expect(logContent).toContain(message);
  });
  test("should handle errors when creating log file", async () => {
    // --- Mocking File System ---
    const error = new Error("Test error");
    const mkdirSyncMock = vi.spyOn(fs, "mkdirSync").mockImplementationOnce((...args) => {
      console.log("mkdirSync arguments:", args); // Log arguments passed to mkdirSync
      throw error;
    });

    // --- Test Execution ---
    try {
      // Add logging to track log file path
      const logFilePath = path.join(process.cwd(), "test-logs", "test.log");
      console.log("Expected log file path:", logFilePath);
      console.log(`Calling Logger.log with "${logFilePath}"`);
      await Logger.log("Test log message", logFilePath);
    } catch (error) {
      // Ignore errors for this test, as we expect an error to be thrown
    }

    // --- Assertions ---
    expect(mkdirSyncMock).toHaveBeenCalledWith(path.dirname(logFilePath), {recursive: true});
    expect(Logger.logError).toHaveBeenCalledWith(`Error creating log file: ${error}`);
  });

  it("should handle errors when writing to log file", () => {
    const message = "Test log message";
    const error = new Error("Test error");
    const writeStreamStub = vi.spyOn(fs.WriteStream.prototype, "write").mockImplementation(() => {
      throw error;
    });
    const logErrorStub = vi.spyOn(Logger, "logError");
    Logger.log(message);
    expect(writeStreamStub).toHaveBeenCalledWith(`[${expect.any(String)}] ${message}\n`);
    expect(logErrorStub).toHaveBeenCalledWith(`Error writing to log file: ${error}`);
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
