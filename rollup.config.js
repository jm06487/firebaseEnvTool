import typescript from "rollup-plugin-typescript2";
import {terser} from "rollup-plugin-terser";
import json from "@rollup/plugin-json";

export default {
  input: "src/main.ts", // Change this to your main TypeScript file
  output: {
    file: "dist/bundle.js",
    format: "cjs", // CommonJS format
  },
  plugins: [typescript(), terser(), json()],
};
