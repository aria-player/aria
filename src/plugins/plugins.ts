import { Plugin, PluginId } from "../features/plugins/pluginsTypes";
import { createSamplePlugin } from "./sampleplugin/createSamplePlugin";
import { createWebPlayer } from "./webplayer/createWebPlayer";

export const plugins: Record<PluginId, Plugin> = {
  webplayer: {
    id: "webplayer",
    type: "source",
    name: "Web Music Library",
    needsTauri: false,
    create: createWebPlayer
  },
  sampleplugin: {
    id: "sampleplugin",
    type: "base",
    name: "Sample Plugin",
    needsTauri: false,
    create: createSamplePlugin
  }
};
