import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { LibraryView } from "../../app/view";

export interface ConfigState {
  theme: string;
  accentColor: string;
  language: string | null;
  displayRemainingTime: boolean;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  initialView: LibraryView | "continue";
  lastView: string;
}

const initialState: ConfigState = {
  theme: "system",
  accentColor: "blue",
  language: null,
  displayRemainingTime: false,
  sidebarWidth: 220,
  sidebarCollapsed: false,
  initialView: LibraryView.Songs,
  lastView: "/"
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
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
    },
    setInitialView: (
      state,
      action: PayloadAction<LibraryView | "continue">
    ) => {
      state.initialView = action.payload;
    },
    setLastView: (state, action: PayloadAction<string>) => {
      state.lastView = action.payload.startsWith("/")
        ? action.payload.substring(1)
        : action.payload;
    }
  }
});

export const {
  setTheme,
  setAccentColor,
  setLanguage,
  setDisplayRemainingTime,
  setSidebarConfig,
  setInitialView,
  setLastView
} = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectAccentColor = (state: RootState) => state.config.accentColor;
export const selectLanguage = (state: RootState) => state.config.language;
export const selectDisplayRemainingTime = (state: RootState) =>
  state.config.displayRemainingTime;
export const selectSidebarWidth = (state: RootState) =>
  state.config.sidebarWidth;
export const selectSidebarCollapsed = (state: RootState) =>
  state.config.sidebarCollapsed;
export const selectInitialView = (state: RootState) => state.config.initialView;
export const selectLastView = (state: RootState) => state.config.lastView;

export default configSlice.reducer;
