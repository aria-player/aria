import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Themes } from "../../app/themes";

export interface ConfigState {
  theme: string;
  windowDecorations: boolean;
  windowFullscreen: boolean;
}

const initialState: ConfigState = {
  theme: Themes.System.id,
  windowDecorations: false,
  windowFullscreen: false
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    setWindowDecorations: (state, action: PayloadAction<boolean>) => {
      state.windowDecorations = action.payload;
    },
    setWindowFullscreen: (state, action: PayloadAction<boolean>) => {
      state.windowFullscreen = action.payload;
    }
  }
});

export const { setTheme, setWindowDecorations, setWindowFullscreen } =
  configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectWindowDecorations = (state: RootState) =>
  state.config.windowDecorations;
export const selectWindowFullscreen = (state: RootState) =>
  state.config.windowFullscreen;

export default configSlice.reducer;
