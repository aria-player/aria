import { store } from "../../app/store";
import { setPluginConfig } from "./pluginsSlice";
import { PluginId, BaseCallbacks, SourceCallbacks } from "./pluginsTypes";

const updateConfig = (pluginId: PluginId, config: unknown) => {
  store.dispatch(setPluginConfig({ plugin: pluginId, config }));
};

const temp = () => {
  console.log("temp");
};

export const getBaseCallbacks = (pluginId: PluginId): BaseCallbacks => {
  return {
    updateConfig: (config: unknown) => updateConfig(pluginId, config)
  };
};

export const getSourceCallbacks = (pluginId: PluginId): SourceCallbacks => {
  return {
    ...getBaseCallbacks(pluginId),
    temp: () => temp
  };
};
