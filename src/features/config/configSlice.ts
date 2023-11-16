import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface ConfigState {
  theme: string;
  language: string | null;
}

const initialState: ConfigState = {
  theme: "system",
  language: null
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
    }
  }
});

export const { setTheme, setLanguage } = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectLanguage = (state: RootState) => state.config.language;

export default configSlice.reducer;
