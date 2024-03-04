import {setTimeout} from "timers";
import {disableConfigOption, editConfigPrompt} from "./config";
import {unsetEnvVarPrompt} from "./envVarManagement";
import eventEmitter from "./events";
import Logger from "./logger";
export function setupListeners() {
  eventEmitter.on("eventHandlerReady", () => {
    Logger.log("eventHandler event caught");
    // Add your setEnvVarPrompt logic here
  });
  eventEmitter.on("setEnvVarPrompt", () => {
    Logger.log("setEnvVarPrompt event caught");
    // Add your setEnvVarPrompt logic here
  });

  eventEmitter.on("unsetEnvVarPrompt", () => {
    Logger.log("unsetEnvVarPrompt event caught");
    // Add your unsetEnvVarPrompt logic here
    unsetEnvVarPrompt();
  });

  eventEmitter.on("editConfigPrompt", () => {
    Logger.log("editConfigPrompt event caught");
    // Add your editConfigPrompt logic here
    editConfigPrompt();
  });

  eventEmitter.on("disableConfigOption", () => {
    Logger.log("disableConfigOption event caught");
    // Add your disableConfigOption logic here
    disableConfigOption();
  });

  eventEmitter.on("startSession", () => {
    Logger.log("startSession event caught");
    // Add your startSession logic here
  });

  eventEmitter.on("endSession", () => {
    Logger.log("endSession event caught");
    setTimeout(() => {}, 1000);
    // Add your endSession logic here
    process.exit(0);
  });
}
