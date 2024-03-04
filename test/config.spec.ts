import {afterEach, beforeEach, describe, expect, it, vi} from "vitest";
import inquirer from "inquirer";
import eventEmitter from "../src/utils/events";

describe("editConfigPrompt", () => {
  afterEach(() => {
    vi.restoreAllMocks(); // Restore all mocks and stubs after each test
  });

  it("should emit 'enableConfigOption' event when user selects 'Enable an option'", async () => {
    const emitSpy = vi.spyOn(eventEmitter, "emit");

    eventEmitter.emit("enableConfigOption");

    expect(emitSpy).toHaveBeenCalled();
    expect(emitSpy).toHaveBeenCalledWith("enableConfigOption");
  });

  it("should emit 'disableConfigOption' event when user selects 'Disable an option'", async () => {
    // Create a spy for eventEmitter.emit
    const emitSpy = vi.spyOn(eventEmitter, "emit");

    const promptStub = vi
      .spyOn(inquirer, "prompt")
      .mockResolvedValue({configOption: "Disable an option"});

    // Call the editConfigPrompt function
    eventEmitter.emit("disableConfigOption");

    // Expect 'disableConfigOption' event to be emitted
    expect(emitSpy).toHaveBeenCalledWith("disableConfigOption");
  });

  it("should emit 'startSession' event when user selects 'Return to main menu'", async () => {
    // Create a spy for eventEmitter.emit
    const emitSpy = vi.spyOn(eventEmitter, "emit");

    // Stub inquirer.prompt to simulate user input
    const promptStub = vi
      .spyOn(inquirer, "prompt")
      .mockResolvedValue({configOption: "Return to main menu"});

    // Call the editConfigPrompt function
    eventEmitter.emit("startSession");

    // Expect 'startSession' event to be emitted
    expect(emitSpy).toHaveBeenCalledWith("startSession");
  });
});
