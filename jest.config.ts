import type {Config} from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  verbose: true,
  automock: true,
  transform: {
    "^.+\\.(ts|tsx)$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!(@babel|inquirer|chalk)/)"],
  unmockedModulePathPatterns: ["<rootDir>/node_modules/chalk/"],
};

export default config;
