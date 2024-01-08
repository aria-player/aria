import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface ConfigState {
  theme: string;
  language: string | null;
  displayRemainingTime: boolean;
}

const initialState: ConfigState = {
  theme: "system",
  language: null,
  displayRemainingTime: false
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string | null>) => {
      state.language = action.payload;
    },
    setDisplayRemainingTime: (state, action: PayloadAction<boolean>) => {
      state.displayRemainingTime = action.payload;
    }
  }
});

export const { setTheme, setLanguage, setDisplayRemainingTime } =
  configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectLanguage = (state: RootState) => state.config.language;
export const selectDisplayRemainingTime = (state: RootState) =>
  state.config.displayRemainingTime;

export default configSlice.reducer;
