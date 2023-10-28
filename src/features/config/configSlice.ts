import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Themes } from "../../app/themes";

export interface ConfigState {
  theme: string;
  windowDecorations: boolean;
}

const initialState: ConfigState = {
  theme: Themes.System.id,
  windowDecorations: false
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
    }
  }
});

export const { setTheme, setWindowDecorations } = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectWindowDecorations = (state: RootState) =>
  state.config.windowDecorations;

export default configSlice.reducer;
