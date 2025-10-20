import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { LibraryView } from "../../app/view";
import JSZip from "jszip";
import {
  defaultStylesheets,
  Theme,
  defaultThemes,
  themeFormatVersion
} from "../../themes/themes";
import { checkCompatibility } from "../../app/utils";
import { t } from "i18next";
import { ArtistDelimiterType } from "../artists/artistsTypes";

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
  artistDelimiterType: ArtistDelimiterType;
  customArtistDelimiter: string;
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
  lastView: "/",
  artistDelimiterType: ArtistDelimiterType.None,
  customArtistDelimiter: ""
};

export const installThemesFromFiles = createAsyncThunk(
  "config/installThemesFromFiles",
  async (blobs: Blob[], { dispatch }) => {
    for (const blob of blobs) {
      const extractedFiles = (await JSZip.loadAsync(blob)).files;
      if ("theme.json" in extractedFiles) {
        const fileData = await extractedFiles["theme.json"].async("string");
        const themeData = JSON.parse(fileData) as Theme;
        const stylesheetFileName = themeData.stylesheet;
        if (stylesheetFileName) {
          if (
            !checkCompatibility(themeFormatVersion, themeData.formatVersion)
          ) {
            const confirmed = await confirm(
              t("settings.appearance.confirmInstallIncompatibleTheme")
            );
            if (!confirmed) return;
          }
          const stylesheet =
            await extractedFiles[stylesheetFileName].async("string");
          dispatch(addTheme({ themeData, stylesheet }));
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
        themeData: Theme;
        stylesheet: string;
      }>
    ) => {
      if (Object.keys(defaultThemes).includes(action.payload.themeData.id))
        return;
      state.installedThemes[action.payload.themeData.id] =
        action.payload.themeData;
      state.installedStylesheets[action.payload.themeData.id] =
        action.payload.stylesheet;
      state.theme = action.payload.themeData.id;
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
    },
    setArtistDelimiterType: (
      state,
      action: PayloadAction<ArtistDelimiterType>
    ) => {
      state.artistDelimiterType = action.payload;
    },
    setCustomArtistDelimiter: (state, action: PayloadAction<string>) => {
      state.customArtistDelimiter = action.payload;
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
  setLastView,
  setArtistDelimiterType,
  setCustomArtistDelimiter
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
export const selectArtistDelimiterType = (state: RootState) =>
  state.config.artistDelimiterType;
export const selectCustomArtistDelimiter = (state: RootState) =>
  state.config.customArtistDelimiter;

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

export const selectArtistDelimiter = createSelector(
  selectArtistDelimiterType,
  selectCustomArtistDelimiter,
  (artistDelimiterType, customArtistDelimiter) => {
    if (artistDelimiterType === ArtistDelimiterType.Custom) {
      return customArtistDelimiter || undefined;
    } else {
      return artistDelimiterType || undefined;
    }
  }
);

export default configSlice.reducer;
