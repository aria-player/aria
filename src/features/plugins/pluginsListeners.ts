import { PluginId } from "./pluginsTypes";
import {
  pluginHandles,
  selectPluginInfo,
  setPluginActive,
  uninstallPlugin
} from "./pluginsSlice";
import {
  getBaseCallbacks,
  getIntegrationCallbacks,
  getSourceCallbacks
} from "./pluginsCallbacks";
import { listenForAction, listenForChange } from "../../app/listener";
import { removeTracks } from "../tracks/tracksSlice";
import { store } from "../../app/store";
import { defaultPluginInfo } from "../../plugins/plugins";
import i18n from "../../i18n";
import { isAnyOf } from "@reduxjs/toolkit";

async function convertModuleStringToFunction(moduleString: string) {
  const blob = new Blob([moduleString], { type: "application/javascript" });
  const moduleUrl = URL.createObjectURL(blob);
  const module = await import(/* @vite-ignore */ moduleUrl);
  URL.revokeObjectURL(moduleUrl);
  return module;
}

function getPluginCallbacks(pluginId: PluginId, capabilities?: string[]) {
  let callbacks = getBaseCallbacks(pluginId);
  if (capabilities?.includes("integration")) {
    callbacks = { ...callbacks, ...getIntegrationCallbacks(pluginId) };
  }
  if (capabilities?.includes("source")) {
    callbacks = { ...callbacks, ...getSourceCallbacks(pluginId) };
  }
  return callbacks;
}

const createPluginInstance = async (pluginId: PluginId) => {
  if (!pluginHandles[pluginId]) {
    const plugin = selectPluginInfo(store.getState())[pluginId];
    if (!plugin) {
      throw new Error(`Plugin "${pluginId}" not found`);
    }
    try {
      let module;
      if (Object.keys(defaultPluginInfo).includes(pluginId)) {
        if (plugin.main.endsWith("tsx")) {
          module = await import(
            `../../plugins/${plugin.id}/${plugin.main.split(".")[0]}.tsx`
          );
        } else {
          module = await import(
            `../../plugins/${plugin.id}/${plugin.main.split(".")[0]}.ts`
          );
        }
      } else {
        module = await convertModuleStringToFunction(
          store.getState().plugins.installedPluginScripts[pluginId]
        );
      }
      const create = module.default;
      const handle = create(
        getPluginCallbacks(pluginId, plugin.capabilities),
        i18n
      );
      if (handle) {
        pluginHandles[pluginId] = handle;
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
  pluginHandles[pluginId]?.dispose?.();
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

  listenForAction(isAnyOf(uninstallPlugin), (_, action) => {
    const pluginId = action.payload as PluginId;
    disposePluginInstance(pluginId);
  });
}
