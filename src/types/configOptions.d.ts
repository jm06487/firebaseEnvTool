// configOptions.d.ts

/**
 * Represents the configuration options for the CLI.
 */
export interface ConfigOptions {
  /**
   * The type of function generation to be used.
   */
  functionGeneration: string;

  /**
   * The path to the runtime configuration file (optional).
   */
  runtimeConfig?: string;

  // Add other properties as needed
}

/**
 * Represents a single configuration option for the CLI.
 */
export interface ConfigOption {
  /**
   * The type of the configuration option.
   */
  type: string;

  /**
   * The message displayed to the user when prompting for this option.
   */
  message: string;

  /**
   * An array of choices for the user to select from (optional).
   */
  choices?: string[];

  /**
   * The default value for the configuration option (optional).
   */
  default?: string;

  /**
   * Indicates whether the configuration option is required.
   * Can be a boolean or a function that takes the current configuration and returns a boolean.
   */
  required: boolean | ((config: ConfigOptions) => boolean);

  /**
   * A function that determines whether this option should be asked based on previous answers (optional).
   */
  when?: (answers: any) => boolean;
}

/**
 * Represents the user configuration options for the CLI.
 */
export interface UserConfigOptions {
  [key: string]: ConfigOption;
}

/**
 * Represents the structure of the Gen1 runtime configuration.
 */
export interface Gen1RuntimeConfig {
  [key: string]: any | Gen1RuntimeConfig;
}

/**
 * Represents the type of configuration options.
 * It can be either UserConfigOptions or Gen1RuntimeConfig.
 */
export type ConfigType = UserConfigOptions | Gen1RuntimeConfig;
