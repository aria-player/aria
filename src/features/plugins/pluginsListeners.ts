import { BasePlugin, PluginId, SourcePlugin } from "./pluginsTypes";
import { pluginHandles } from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";
import { getBaseCallbacks, getSourceCallbacks } from "./pluginsCallbacks";
import { startListening } from "../../app/listener";

const createPluginInstance = (pluginId: PluginId) => {
  if (!pluginHandles[pluginId]) {
    const plugin = plugins[pluginId];
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    switch (plugin.type) {
      case "base":
        pluginHandles[pluginId] = (plugin as BasePlugin).create(
          getBaseCallbacks(pluginId)
        );
        break;
      case "source":
        pluginHandles[pluginId] = (plugin as SourcePlugin).create(
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
    predicate: (_action, currentState, previousState) => {
      return (
        currentState.plugins.activePlugins !==
        previousState.plugins.activePlugins
      );
    },
    effect: (_action, api) => {
      const activePlugins = api.getState().plugins.activePlugins;
      Object.keys(pluginHandles).forEach((plugin) => {
        if (!activePlugins.includes(plugin)) {
          disposePluginInstance(plugin);
        }
      });
      activePlugins.forEach(createPluginInstance);
    }
  });
}
