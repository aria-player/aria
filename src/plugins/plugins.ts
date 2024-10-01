import { PluginInfo } from "../features/plugins/pluginsTypes";

export const defaultPluginInfo: Record<string, PluginInfo> = {};

const pluginManifests = import.meta.glob("./*/plugin.json", { eager: true });
for (const path of Object.keys(pluginManifests)) {
  const pluginInfo = pluginManifests[path] as { default: PluginInfo };
  const pluginId = pluginInfo.default.id;
  defaultPluginInfo[pluginId] = pluginInfo.default;
}
