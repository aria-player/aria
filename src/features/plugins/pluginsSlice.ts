import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PluginHandle, PluginId } from "./pluginsTypes";
import { RootState } from "../../app/store";
import { setupPluginListeners } from "./pluginsListeners";

type PluginsState = {
  pluginsActive: PluginId[];
  pluginsConfig: Partial<Record<PluginId, object>>;
};

export const pluginHandles: Partial<Record<PluginId, PluginHandle>> = {};

const initialState: PluginsState = {
  pluginsActive: ["webplayer"],
  pluginsConfig: {}
};

export const pluginsSlice = createSlice({
  name: "plugins",
  initialState,
  reducers: {
    setPluginActive: (
      state,
      action: PayloadAction<{ plugin: PluginId; active: boolean }>
    ) => {
      const { plugin, active } = action.payload;
      if (active && !state.pluginsActive.includes(plugin)) {
        state.pluginsActive.push(plugin);
      } else {
        state.pluginsActive = state.pluginsActive.filter((p) => p !== plugin);
        delete state.pluginsConfig[plugin];
      }
    },
    setPluginConfig: (
      state,
      action: PayloadAction<{ plugin: PluginId; config: object }>
    ) => {
      const { plugin, config } = action.payload;
      state.pluginsConfig[plugin] = {
        ...state.pluginsConfig[plugin],
        ...config
      };
    }
  }
});

export const { setPluginActive, setPluginConfig } = pluginsSlice.actions;

export const selectPluginsConfig = (state: RootState) =>
  state.plugins.pluginsConfig;
export const selectPluginsActive = (state: RootState) =>
  state.plugins.pluginsActive;

export default pluginsSlice.reducer;

setupPluginListeners();
