import {
  IntegrationCallbacks,
  IntegrationHandle,
} from "../../../../types/plugins";
import { Track } from "../../../../types/tracks";
import { resolveArtworkUrl } from "./artwork";
import { clearActivity, connect, setActivity } from "./activity";

export default function createDiscordRichPresence(
  host: IntegrationCallbacks
): IntegrationHandle | null {
  if (!import.meta.env.VITE_DISCORD_CLIENT_ID) {
    console.error("Discord Rich Presence not available (Client ID not set)");
    return null;
  }
  connect(import.meta.env.VITE_DISCORD_CLIENT_ID);

  return {
    onPlay(metadata: Track, artwork?: string) {
      void resolveArtworkUrl(artwork).then((url) => {
        void setActivity(
          metadata,
          0,
          url,
          host.getSourceDisplayName(metadata.source)
        );
      });
    },
    onPause() {
      void clearActivity();
    },
    async onResume(position: number) {
      const currentTrack = host.getCurrentTrack();
      if (!currentTrack) return;
      const artwork = await host.getCurrentArtwork().then(resolveArtworkUrl);
      void setActivity(
        currentTrack,
        position,
        artwork,
        host.getSourceDisplayName(currentTrack.source)
      );
    },
    async onSeek(position: number) {
      const currentTrack = host.getCurrentTrack();
      if (!currentTrack) return;
      const artwork = await host.getCurrentArtwork().then(resolveArtworkUrl);
      void setActivity(
        currentTrack,
        position,
        artwork,
        host.getSourceDisplayName(currentTrack.source)
      );
    },
    onStop() {
      void clearActivity();
    },
    dispose() {
      void clearActivity();
    },
  };
}
