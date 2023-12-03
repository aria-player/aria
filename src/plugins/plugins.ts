import {
  Plugin,
  PluginCallbacks,
  PluginHandle,
  PluginId
} from "../features/plugins/pluginsTypes";
import { createSamplePlugin } from "./sampleplugin/createSamplePlugin";

export const plugins: Record<
  PluginId,
  Plugin<PluginHandle, PluginCallbacks>
> = {
  sampleplugin: {
    id: "sampleplugin",
    name: "Sample Plugin",
    needsTauri: false,
    create: createSamplePlugin
  }
};
