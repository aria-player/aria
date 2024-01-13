import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

export interface ConfigState {
  theme: string;
  language: string | null;
  displayRemainingTime: boolean;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
}

const initialState: ConfigState = {
  theme: "system",
  language: null,
  displayRemainingTime: false,
  sidebarWidth: 220,
  sidebarCollapsed: false
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
    },
    setSidebarConfig: (
      state,
      action: PayloadAction<{ width: number; collapsed: boolean }>
    ) => {
      state.sidebarWidth = action.payload.width;
      state.sidebarCollapsed = action.payload.collapsed;
    }
  }
});

export const {
  setTheme,
  setLanguage,
  setDisplayRemainingTime,
  setSidebarConfig
} = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectLanguage = (state: RootState) => state.config.language;
export const selectDisplayRemainingTime = (state: RootState) =>
  state.config.displayRemainingTime;
export const selectSidebarWidth = (state: RootState) =>
  state.config.sidebarWidth;
export const selectSidebarCollapsed = (state: RootState) =>
  state.config.sidebarCollapsed;

export default configSlice.reducer;
