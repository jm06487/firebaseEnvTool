import typescript from "rollup-plugin-typescript2";
import {terser} from "rollup-plugin-terser";
import json from "@rollup/plugin-json";
import ignore from "rollup-plugin-ignore";
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";

export default {
  input: "src/main.ts", // Change this to your main TypeScript file
  treeshake: false,
  output: {
    file: "dist/bundle.js",
    format: "esm", // CommonJS format
  },
  plugins: [
    typescript(),
    terser(),
    json(),
    ignore(["**/*.test.ts", "**/*.spec.ts"]), // Ignore all test files
    excludeDependenciesFromBundle({
      peerDependencies: false,
      exclude: ["**/*.test.ts", "**/*.spec.ts"],
    }),
  ],
  external: ["child_process", "inquirer", "fs", "os", "path", "events"],
};
