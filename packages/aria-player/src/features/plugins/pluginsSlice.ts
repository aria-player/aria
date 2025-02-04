import {
  createAsyncThunk,
  createSelector,
  createSlice,
  PayloadAction
} from "@reduxjs/toolkit";
import { AnyPluginHandle } from "./pluginsTypes";
import {
  PluginId,
  PluginInfo,
  SourceHandle,
  SyncProgress
} from "../../../../types/plugins";
import { setupPluginListeners } from "./pluginsListeners";
import { RootState, store } from "../../app/store";
import { checkCompatibility, isTauri } from "../../app/utils";
import JSZip from "jszip";
import { defaultPluginInfo, pluginFormatVersion } from "../../plugins/plugins";
import { t } from "i18next";

type PluginsState = {
  installedPluginInfo: Record<PluginId, PluginInfo>;
  installedPluginScripts: Record<PluginId, string>;
  enabledPlugins: PluginId[];
  activePlugins: PluginId[];
  pluginData: Partial<Record<PluginId, object>>;
  sourceSyncProgress: Record<PluginId, SyncProgress>;
};

export const pluginHandles: Partial<Record<PluginId, AnyPluginHandle>> = {};

const initialState: PluginsState = {
  installedPluginInfo: {},
  installedPluginScripts: {},
  enabledPlugins: [
    "media-session",
    isTauri() ? "tauri-player" : "web-player",
    "spotify-player",
    "apple-music-player"
  ],
  activePlugins: [],
  pluginData: {},
  sourceSyncProgress: {}
};

export function getSourceHandle(pluginId: PluginId): SourceHandle | undefined {
  const pluginInfo = selectPluginInfo(store.getState());
  if (pluginInfo[pluginId]?.capabilities?.includes("source")) {
    return pluginHandles[pluginId];
  }
}

export const installPluginsFromFiles = createAsyncThunk(
  "plugins/installPluginsFromFiles",
  async (files: File[], { dispatch }) => {
    for (const file of files) {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith(".zip")) {
        const extractedFiles = (await JSZip.loadAsync(file)).files;
        for (const extractedFileName in extractedFiles) {
          if (extractedFileName === "plugin.json") {
            const fileData =
              await extractedFiles[extractedFileName].async("string");
            const info = JSON.parse(fileData) as PluginInfo;
            const mainFileName = info.main;
            if (mainFileName) {
              if (
                !checkCompatibility(pluginFormatVersion, info.formatVersion)
              ) {
                const confirmed = await confirm(
                  t("settings.plugins.confirmInstallIncompatiblePlugin")
                );
                if (!confirmed) return;
              }
              const script = await extractedFiles[mainFileName].async("string");
              dispatch(installPlugin({ info, script }));
            }
          }
        }
      }
    }
  }
);

export const pluginsSlice = createSlice({
  name: "plugins",
  initialState,
  reducers: {
    installPlugin: (
      state,
      action: PayloadAction<{ info: PluginInfo; script: string }>
    ) => {
      const { info, script } = action.payload;
      state.installedPluginInfo[info.id] = info;
      state.installedPluginScripts[info.id] = script;
      if (!state.enabledPlugins.includes(info.id)) {
        state.enabledPlugins.push(info.id);
      }
    },
    uninstallPlugin: (state, action: PayloadAction<PluginId>) => {
      state.enabledPlugins = state.enabledPlugins.filter(
        (plugin) => plugin != action.payload
      );
      delete state.installedPluginInfo[action.payload];
      delete state.installedPluginScripts[action.payload];
      delete state.pluginData[action.payload];
    },
    setPluginEnabled: (
      state,
      action: PayloadAction<{ plugin: PluginId; enabled: boolean }>
    ) => {
      const { plugin, enabled } = action.payload;
      if (enabled && !state.enabledPlugins.includes(plugin)) {
        state.enabledPlugins.push(plugin);
      } else {
        state.enabledPlugins = state.enabledPlugins.filter((p) => p !== plugin);
        delete state.pluginData[plugin];
        delete state.sourceSyncProgress[plugin];
      }
    },
    setPluginActive: (
      state,
      action: PayloadAction<{ plugin: PluginId; active: boolean }>
    ) => {
      const { plugin, active } = action.payload;
      if (active && !state.activePlugins.includes(plugin)) {
        state.activePlugins.push(plugin);
      } else {
        state.activePlugins = state.activePlugins.filter((p) => p !== plugin);
      }
    },
    setPluginData: (
      state,
      action: PayloadAction<{ plugin: PluginId; data: object }>
    ) => {
      const { plugin, data } = action.payload;
      state.pluginData[plugin] = {
        ...state.pluginData[plugin],
        ...data
      };
    },
    setSourceSyncProgress(
      state,
      action: PayloadAction<{ pluginId: string; syncProgress: SyncProgress }>
    ) {
      const { pluginId, syncProgress } = action.payload;
      state.sourceSyncProgress[pluginId] = syncProgress;
    }
  }
});

export const {
  installPlugin,
  uninstallPlugin,
  setPluginEnabled,
  setPluginActive,
  setPluginData,
  setSourceSyncProgress
} = pluginsSlice.actions;

export const selectEnabledPlugins = (state: RootState) =>
  state.plugins.enabledPlugins;
export const selectActivePlugins = (state: RootState) =>
  state.plugins.activePlugins;
export const selectPluginData = (state: RootState) => state.plugins.pluginData;
export const selectSourceSyncProgress = (state: RootState) =>
  state.plugins.sourceSyncProgress;

export const selectPluginInfo = createSelector(
  (state: RootState) => state.plugins.installedPluginInfo,
  (installedPluginInfo) => ({
    ...defaultPluginInfo,
    ...installedPluginInfo
  })
);

export const selectAggregateSyncProgress = createSelector(
  (state: RootState) => state.plugins.sourceSyncProgress,
  (sourceSyncProgress) => {
    const pluginIds = Object.keys(sourceSyncProgress);
    let synced = 0;
    let total = 0;
    for (const pluginId of pluginIds) {
      synced += sourceSyncProgress[pluginId].synced;
      total += sourceSyncProgress[pluginId].total;
    }
    return total > 0 ? Math.round((synced / total) * 100) : null;
  }
);

export default pluginsSlice.reducer;

setupPluginListeners();
