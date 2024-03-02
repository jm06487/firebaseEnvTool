/**
 * Represents a function that generates a GenVersion.
 */
export type Gen = () => GenVersion;

/**
 * Represents the structure of a GenVersion.
 */
export interface GenVersion {
  // Define the properties of a GenVersion here
  [key: string]: any;
}
