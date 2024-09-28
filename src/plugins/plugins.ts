import { PluginId, PluginInfo } from "../features/plugins/pluginsTypes";

export const plugins: Record<PluginId, PluginInfo> = {
  tauriplayer: {
    id: "tauriplayer",
    type: "source",
    name: "Local Files",
    needsTauri: true,
    main: "createTauriPlayer.ts"
  },
  webplayer: {
    id: "webplayer",
    type: "source",
    name: "Web Music Library",
    needsTauri: false,
    main: "createWebPlayer.ts"
  },
  mediasession: {
    id: "mediasession",
    type: "integration",
    name: "Media Session",
    needsTauri: false,
    main: "createMediaSession.ts"
  },
  sampleplugin: {
    id: "sampleplugin",
    type: "base",
    name: "Sample Plugin",
    needsTauri: false,
    main: "createSamplePlugin.tsx"
  }
};
