import { BasePlugin, PluginId, SourcePlugin } from "./pluginsTypes";
import { pluginHandles } from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";
import { getBaseCallbacks, getSourceCallbacks } from "./pluginsCallbacks";
import { listenForChange } from "../../app/listener";
import { removeTracks } from "../tracks/tracksSlice";

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
  listenForChange(
    (state) => state.plugins.activePlugins,
    (state, _action, dispatch) => {
      Object.keys(pluginHandles).forEach((plugin) => {
        if (!state.plugins.activePlugins.includes(plugin)) {
          disposePluginInstance(plugin);
          dispatch(removeTracks({ source: plugin }));
        }
      });
      state.plugins.activePlugins.forEach(createPluginInstance);
    }
  );
}
