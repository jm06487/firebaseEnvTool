import {disableConfigOption, editConfigPrompt} from "./config";
import {unsetEnvVarPrompt} from "./envVarManagement";
import eventEmitter from "./events";

export function setupListeners() {
  eventEmitter.on("setEnvVarPrompt", () => {
    console.log("setEnvVarPrompt event caught");
    // Add your setEnvVarPrompt logic here
  });

  eventEmitter.on("unsetEnvVarPrompt", () => {
    console.log("unsetEnvVarPrompt event caught");
    // Add your unsetEnvVarPrompt logic here
    unsetEnvVarPrompt();
  });

  eventEmitter.on("editConfigPrompt", () => {
    console.log("editConfigPrompt event caught");
    // Add your editConfigPrompt logic here
    editConfigPrompt();
  });
  eventEmitter.on("disableConfigOption", () => {
    console.log("disableConfigOption event caught");
    // Add your disableConfigOption logic here
    disableConfigOption();
  });
}
