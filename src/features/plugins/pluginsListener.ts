import { RootState, store } from "../../app/store";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { PluginCallbacks, PluginId } from "./pluginsTypes";
import {
  pluginHandles,
  selectPluginsActive,
  selectPluginsConfig,
  setPluginConfig
} from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";

export const pluginsListener = createListenerMiddleware();

const getPluginCallbacks = (plugin: PluginId): PluginCallbacks => {
  return {
    pong: (message: string) => {
      console.log(`Message received by app: ${message}`);
    },
    updateConfig: (config: unknown) => {
      store.dispatch(setPluginConfig({ plugin, config }));
    }
  };
};

const createPluginInstance = (plugin: PluginId) => {
  if (!pluginHandles[plugin]) {
    const currentState = store.getState();
    const config = selectPluginsConfig(currentState);
    if (!plugins[plugin]) {
      throw new Error(`Plugin "${plugin}" not found`);
    }
    pluginHandles[plugin] = plugins[plugin].create(
      config[plugin],
      getPluginCallbacks(plugin)
    );
    pluginHandles[plugin]?.ping?.("Hello");
  }
};

const disposePluginInstance = (plugin: PluginId) => {
  pluginHandles[plugin]?.dispose();
  delete pluginHandles[plugin];
};

pluginsListener.startListening({
  predicate: (_action, currentState: RootState, previousState: RootState) => {
    return (
      currentState.plugins.pluginsActive !== previousState.plugins.pluginsActive
    );
  },
  effect: (_action, api) => {
    const state = api.getState();
    const activePlugins = selectPluginsActive(state);
    Object.keys(pluginHandles).forEach((plugin: PluginId) => {
      if (!activePlugins.includes(plugin)) {
        disposePluginInstance(plugin);
      }
    });
    activePlugins.forEach(createPluginInstance);
  }
});
