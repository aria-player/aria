import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { PluginHandle, PluginId } from "./pluginsTypes";
import { RootState } from "../../app/store";
import { setupPluginListeners } from "./pluginsListeners";

type PluginsState = {
  pluginsActive: PluginId[];
  pluginsData: Partial<Record<PluginId, object>>;
};

export const pluginHandles: Partial<Record<PluginId, PluginHandle>> = {};

const initialState: PluginsState = {
  pluginsActive: ["webplayer"],
  pluginsData: {}
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
        delete state.pluginsData[plugin];
      }
    },
    setPluginData: (
      state,
      action: PayloadAction<{ plugin: PluginId; data: object }>
    ) => {
      const { plugin, data } = action.payload;
      state.pluginsData[plugin] = {
        ...state.pluginsData[plugin],
        ...data
      };
    }
  }
});

export const { setPluginActive, setPluginData } = pluginsSlice.actions;

export const selectPluginsData = (state: RootState) =>
  state.plugins.pluginsData;
export const selectPluginsActive = (state: RootState) =>
  state.plugins.pluginsActive;

export default pluginsSlice.reducer;

setupPluginListeners();
