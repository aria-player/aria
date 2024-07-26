import {
  BasePlugin,
  IntegrationPlugin,
  PluginId,
  SourcePlugin
} from "./pluginsTypes";
import { pluginHandles } from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";
import {
  getBaseCallbacks,
  getIntegrationCallbacks,
  getSourceCallbacks
} from "./pluginsCallbacks";
import { listenForChange } from "../../app/listener";
import { removeTracks } from "../tracks/tracksSlice";

const createPluginInstance = (pluginId: PluginId) => {
  if (!pluginHandles[pluginId]) {
    const plugin = plugins[pluginId];
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    try {
      switch (plugin.type) {
        case "base": {
          const handle = (plugin as BasePlugin).create(
            getBaseCallbacks(pluginId)
          );
          if (handle) pluginHandles[pluginId] = handle;
          break;
        }
        case "integration": {
          const handle = (plugin as IntegrationPlugin).create(
            getIntegrationCallbacks(pluginId)
          );
          if (handle) pluginHandles[pluginId] = handle;
          break;
        }
        case "source": {
          const handle = (plugin as SourcePlugin).create(
            getSourceCallbacks(pluginId)
          );
          if (handle) pluginHandles[pluginId] = handle;
          break;
        }
      }
    } catch (error) {
      console.error(
        `Failed to create plugin "${pluginId}" with error: ${error}`
      );
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
      if (!state.tracks._persist?.rehydrated) return;
      Object.keys(pluginHandles).forEach((plugin) => {
        if (!state.plugins.activePlugins.includes(plugin)) {
          disposePluginInstance(plugin);
          dispatch(removeTracks({ source: plugin }));
        }
      });
      state.plugins.activePlugins.forEach(createPluginInstance);
    }
  );

  listenForChange(
    (state) => state.tracks._persist?.rehydrated,
    (state) => {
      if (state.tracks._persist?.rehydrated) {
        state.plugins.activePlugins.forEach(createPluginInstance);
      }
    }
  );
}
