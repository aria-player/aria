import {
  Plugin,
  PluginCallbacks,
  PluginHandle,
  PluginId
} from "../features/plugins/pluginsTypes";
import { createSamplePlugin } from "./sampleplugin/createSamplePlugin";
import { createWebPlayer } from "./webplayer/createWebPlayer";

export const plugins: Record<
  PluginId,
  Plugin<PluginHandle, PluginCallbacks>
> = {
  webplayer: {
    id: "webplayer",
    name: "Web Music Library",
    needsTauri: false,
    create: createWebPlayer
  },
  sampleplugin: {
    id: "sampleplugin",
    name: "Sample Plugin",
    needsTauri: false,
    create: createSamplePlugin
  }
};
