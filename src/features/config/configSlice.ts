import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { LibraryView } from "../../app/view";
import JSZip from "jszip";
import { defaultStylesheets, Theme, defaultThemes } from "../../themes/themes";

export interface ConfigState {
  theme: string;
  installedThemes: Record<string, Theme>;
  installedStylesheets: Record<string, string>;
  accentColor: string;
  customAccentColor: string;
  language: string | null;
  displayRemainingTime: boolean;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  initialView: LibraryView | "continue";
  lastView: string;
}

const initialState: ConfigState = {
  theme: "system",
  installedThemes: {},
  installedStylesheets: {},
  accentColor: "blue",
  customAccentColor: "#495057",
  language: null,
  displayRemainingTime: false,
  sidebarWidth: 220,
  sidebarCollapsed: false,
  initialView: LibraryView.Songs,
  lastView: "/"
};

export const installThemesFromFiles = createAsyncThunk(
  "config/installThemesFromFiles",
  async (files: File[], { dispatch }) => {
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".zip")) {
        const themeId = fileName.replace(".zip", "");
        const extractedFiles = (await JSZip.loadAsync(file)).files;
        for (const extractedFileName in extractedFiles) {
          if (extractedFileName === "theme.json") {
            const fileData =
              await extractedFiles[extractedFileName].async("string");
            const themeData = JSON.parse(fileData) as Theme;
            const stylesheetFileName = themeData.stylesheet;
            if (stylesheetFileName) {
              const stylesheet =
                await extractedFiles[stylesheetFileName].async("string");
              dispatch(addTheme({ themeId, themeData, stylesheet }));
            }
          }
        }
      }
    }
  }
);

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    },
    addTheme: (
      state,
      action: PayloadAction<{
        themeId: string;
        themeData: Theme;
        stylesheet: string;
      }>
    ) => {
      if (Object.keys(defaultThemes).includes(action.payload.themeId)) return;
      state.installedThemes[action.payload.themeId] = action.payload.themeData;
      state.installedStylesheets[action.payload.themeId] =
        action.payload.stylesheet;
      state.theme = action.payload.themeId;
    },
    removeTheme: (state, action: PayloadAction<string>) => {
      if (state.theme == action.payload) {
        state.theme = "system";
      }
      delete state.installedThemes[action.payload];
      delete state.installedStylesheets[action.payload];
    },
    setAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = action.payload;
    },
    setCustomAccentColor: (state, action: PayloadAction<string>) => {
      state.accentColor = "custom";
      state.customAccentColor = action.payload;
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
  addTheme,
  removeTheme,
  setAccentColor,
  setCustomAccentColor,
  setLanguage,
  setDisplayRemainingTime,
  setSidebarConfig,
  setInitialView,
  setLastView
} = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;
export const selectAccentColor = (state: RootState) => state.config.accentColor;
export const selectCustomAccentColor = (state: RootState) =>
  state.config.customAccentColor;
export const selectLanguage = (state: RootState) => state.config.language;
export const selectDisplayRemainingTime = (state: RootState) =>
  state.config.displayRemainingTime;
export const selectSidebarWidth = (state: RootState) =>
  state.config.sidebarWidth;
export const selectSidebarCollapsed = (state: RootState) =>
  state.config.sidebarCollapsed;
export const selectInitialView = (state: RootState) => state.config.initialView;
export const selectLastView = (state: RootState) => state.config.lastView;

export const selectThemes = createSelector(
  (state: RootState) => state.config.installedThemes,
  (installedThemes) => ({
    ...defaultThemes,
    ...installedThemes
  })
);
export const selectStylesheets = createSelector(
  (state: RootState) => state.config.installedStylesheets,
  (installedStylesheets) => ({
    ...defaultStylesheets,
    ...installedStylesheets
  })
);

export default configSlice.reducer;
