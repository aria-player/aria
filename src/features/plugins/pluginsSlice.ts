import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PluginHandle, PluginId } from "./pluginsTypes";
import { setupPluginListeners } from "./pluginsListeners";
import { RootState } from "../../app/store";
import { isTauri } from "../../app/utils";

type PluginsState = {
  enabledPlugins: PluginId[];
  activePlugins: PluginId[];
  pluginData: Partial<Record<PluginId, object>>;
};

export const pluginHandles: Partial<Record<PluginId, PluginHandle>> = {};

const initialState: PluginsState = {
  enabledPlugins: ["mediasession", isTauri() ? "tauriplayer" : "webplayer"],
  activePlugins: [],
  pluginData: {}
};

export const pluginsSlice = createSlice({
  name: "plugins",
  initialState,
  reducers: {
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
    }
  }
});

export const { setPluginEnabled, setPluginActive, setPluginData } =
  pluginsSlice.actions;

export const selectEnabledPlugins = (state: RootState) =>
  state.plugins.enabledPlugins;
export const selectActivePlugins = (state: RootState) =>
  state.plugins.activePlugins;
export const selectPluginData = (state: RootState) => state.plugins.pluginData;

export default pluginsSlice.reducer;

setupPluginListeners();
