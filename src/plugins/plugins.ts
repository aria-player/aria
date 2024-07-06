import { Plugin, PluginId } from "../features/plugins/pluginsTypes";
import { createMediaSession } from "./mediasession/createMediaSession";
import { createSamplePlugin } from "./sampleplugin/createSamplePlugin";
import { createTauriPlayer } from "./tauriplayer/createTauriPlayer";
import { createWebPlayer } from "./webplayer/createWebPlayer";

export const plugins: Record<PluginId, Plugin> = {
  tauriplayer: {
    id: "tauriplayer",
    type: "source",
    name: "Local Files",
    needsTauri: true,
    create: createTauriPlayer
  },
  webplayer: {
    id: "webplayer",
    type: "source",
    name: "Web Music Library",
    needsTauri: false,
    create: createWebPlayer
  },
  mediasession: {
    id: "mediasession",
    type: "integration",
    name: "Media Session",
    needsTauri: false,
    create: createMediaSession
  },
  sampleplugin: {
    id: "sampleplugin",
    type: "base",
    name: "Sample Plugin",
    needsTauri: false,
    create: createSamplePlugin
  }
};
