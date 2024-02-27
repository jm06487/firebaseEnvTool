import {ConfigOptions, UserConfigOptions} from "src/types/configOptions";

/**
 * User configuration options for the CLI.
 */
export const USER_CONFIG_OPTIONS: UserConfigOptions = {
  /**
   * Configuration option for function generation.
   *
   * @type {"list"}
   * @message "Select the generation of functions you want to handle:"
   * @choices ["Gen 1", "Gen 2"]
   * @required true
   */
  functionGeneration: {
    type: "list",
    message: "Select the generation of functions you want to handle:",
    choices: ["Gen 1", "Gen 2"],
    required: true,
  },
  /**
   * Configuration option for runtime config.
   *
   * @type {"input"}
   * @message "Enter the path to your .runtimeconfig.json file:"
   * @default "."
   * @required (config: ConfigOptions) => config.functionGeneration === "Gen 1"
   */
  runtimeConfig: {
    type: "input",
    message: "Enter the path to your .runtimeconfig.json file:",
    default: ".",
    required: (config: ConfigOptions) => config.functionGeneration === "Gen 1",
  },
};
