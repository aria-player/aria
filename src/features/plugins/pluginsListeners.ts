import { RootState, store } from "../../app/store";
import { BasePlugin, PluginId, SourcePlugin } from "./pluginsTypes";
import {
  pluginHandles,
  selectPluginsActive,
  selectPluginsConfig
} from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";
import { getBaseCallbacks, getSourceCallbacks } from "./pluginsCallbacks";
import { startListening } from "../../app/listener";

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

export function setupPluginListeners() {
  startListening({
    predicate: (_action, currentState: RootState, previousState: RootState) => {
      return (
        currentState.plugins.pluginsActive !==
        previousState.plugins.pluginsActive
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
}
