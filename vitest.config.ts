import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    // ... other options
    silent: false, // Enable logging from Node.js processes
  },
});
