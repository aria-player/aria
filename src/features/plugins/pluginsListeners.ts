import { PluginId } from "./pluginsTypes";
import { pluginHandles, setPluginActive } from "./pluginsSlice";
import { plugins } from "../../plugins/plugins";
import {
  getBaseCallbacks,
  getIntegrationCallbacks,
  getSourceCallbacks
} from "./pluginsCallbacks";
import { listenForChange } from "../../app/listener";
import { removeTracks } from "../tracks/tracksSlice";
import { store } from "../../app/store";

const createPluginInstance = async (pluginId: PluginId) => {
  if (!pluginHandles[pluginId]) {
    const plugin = plugins[pluginId];
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    try {
      const isTsx = plugin.main.endsWith("tsx");
      const { default: create } = await import(
        `../../plugins/${plugin.id}/${plugin.main.split(".")[0]}.${isTsx ? "tsx" : "ts"}`
      );
      switch (plugin.type) {
        case "base": {
          const handle = create(getBaseCallbacks(pluginId));
          if (handle) pluginHandles[pluginId] = handle;
          break;
        }
        case "integration": {
          const handle = create(getIntegrationCallbacks(pluginId));
          if (handle) pluginHandles[pluginId] = handle;
          break;
        }
        case "source": {
          const handle = create(getSourceCallbacks(pluginId));
          if (handle) pluginHandles[pluginId] = handle;
          break;
        }
      }
      store.dispatch(setPluginActive({ plugin: pluginId, active: true }));
    } catch (error) {
      console.error(
        `Failed to create plugin "${pluginId}" with error: ${error}`
      );
    }
  }
};

const disposePluginInstance = (pluginId: PluginId) => {
  pluginHandles[pluginId]?.dispose();
  delete pluginHandles[pluginId];
  store.dispatch(setPluginActive({ plugin: pluginId, active: false }));
};

export function setupPluginListeners() {
  listenForChange(
    (state) => state.plugins.enabledPlugins,
    (state, _action, dispatch) => {
      if (!state.tracks._persist?.rehydrated) return;
      Object.keys(pluginHandles).forEach((plugin) => {
        if (!state.plugins.enabledPlugins.includes(plugin)) {
          disposePluginInstance(plugin);
          dispatch(removeTracks({ source: plugin }));
        }
      });
      state.plugins.enabledPlugins.forEach(createPluginInstance);
    }
  );

  listenForChange(
    (state) => state.tracks._persist?.rehydrated,
    (state) => {
      if (state.tracks._persist?.rehydrated) {
        state.plugins.enabledPlugins.forEach(createPluginInstance);
      }
    }
  );
}
