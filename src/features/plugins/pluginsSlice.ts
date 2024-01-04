import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PluginHandle, PluginId } from "./pluginsTypes";
import { setupPluginListeners } from "./pluginsListeners";
import { RootState } from "../../app/store";

type PluginsState = {
  activePlugins: PluginId[];
  pluginData: Partial<Record<PluginId, object>>;
};

export const pluginHandles: Partial<Record<PluginId, PluginHandle>> = {};

const initialState: PluginsState = {
  activePlugins: ["webplayer"],
  pluginData: {}
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
      if (active && !state.activePlugins.includes(plugin)) {
        state.activePlugins.push(plugin);
      } else {
        state.activePlugins = state.activePlugins.filter((p) => p !== plugin);
        delete state.pluginData[plugin];
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

export const { setPluginActive, setPluginData } = pluginsSlice.actions;

export const selectActivePlugins = (state: RootState) =>
  state.plugins.activePlugins;
export const selectPluginData = (state: RootState) => state.plugins.pluginData;

export default pluginsSlice.reducer;

setupPluginListeners();
