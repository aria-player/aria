import { RootState, store } from "../../app/store";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  BaseCallbacks,
  BasePlugin,
  PluginId,
  SourceCallbacks,
  SourcePlugin
} from "./pluginsTypes";
import {
  pluginHandles,
  selectPluginsActive,
  selectPluginsConfig,
  setPluginConfig
} from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";

export const pluginsListener = createListenerMiddleware();

const getBaseCallbacks = (pluginId: PluginId): BaseCallbacks => {
  return {
    updateConfig: (config: unknown) => {
      store.dispatch(setPluginConfig({ plugin: pluginId, config }));
    }
  };
};

const getSourceCallbacks = (pluginId: PluginId): SourceCallbacks => {
  return {
    ...getBaseCallbacks(pluginId),
    temp: () => {
      console.log("temp");
    }
  };
};

const createPluginInstance = (pluginId: PluginId) => {
  if (!pluginHandles[pluginId]) {
    const currentState = store.getState();
    const config = selectPluginsConfig(currentState);
    const plugin = plugins[pluginId];
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    switch (plugin.type) {
      case "base":
        pluginHandles[pluginId] = (plugin as BasePlugin).create(
          config[pluginId],
          getBaseCallbacks(pluginId)
        );
        break;
      case "source":
        pluginHandles[pluginId] = (plugin as SourcePlugin).create(
          config[pluginId],
          getSourceCallbacks(pluginId)
        );
        break;
    }
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
