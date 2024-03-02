// state.ts

export interface StateConfig {
  [key: string]: string | undefined;
  // Define other properties here if needed
}

export interface State {
  config: StateConfig;
}

export const state: State = {
  config: {
    key: "value",
    // Initialize other properties as needed
  },
};
