import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export enum Theme {
  System = "system",
  Light = "light",
  Dark = "dark",
  Midnight = "midnight"
}

export interface ConfigState {
  theme: Theme;
}

const initialState: ConfigState = {
  theme: Theme.System
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<Theme>) => {
      state.theme = action.payload;
    }
  }
});

export const { setTheme } = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;

export default configSlice.reducer;
