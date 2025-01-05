import { PluginInfo } from "../../../types/plugins";

export const defaultPluginInfo: Record<string, PluginInfo> = {};
export const defaultPluginScripts: Record<string, unknown> = {};

const pluginManifests = import.meta.glob("./*/plugin.json", { eager: true });
const pluginFiles = import.meta.glob("./**/*.{ts,tsx}", { eager: true });

for (const path of Object.keys(pluginManifests)) {
  const pluginInfo = pluginManifests[path] as { default: PluginInfo };
  const pluginId = pluginInfo.default.id;
  defaultPluginInfo[pluginId] = pluginInfo.default;
  defaultPluginScripts[pluginId] =
    pluginFiles[`./${pluginId}/${pluginInfo.default.main}`];
}
