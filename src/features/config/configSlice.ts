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
  language: null,
  displayRemainingTime: false,
  sidebarWidth: 220,
  sidebarCollapsed: false,
  initialView: LibraryView.Songs,
  lastView: "/"
};

export const installThemesFromFiles = createAsyncThunk(
  "config/installThemesFromFiles",
  async (fileHandles: FileSystemFileHandle[], { dispatch }) => {
    for (const fileHandle of fileHandles) {
      const file = await fileHandle.getFile();
      const fileName = fileHandle.name.toLowerCase();
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
      state.installedStylesheets[
        `./${action.payload.themeId}/${action.payload.themeData.stylesheet}`
      ] = action.payload.stylesheet;
      state.theme = action.payload.themeId;
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
  addTheme,
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
    ...Object.fromEntries(
      Object.entries(defaultStylesheets).map(([key, value]) => [
        key,
        value.default
      ])
    ),
    ...installedStylesheets
  })
);

export default configSlice.reducer;
