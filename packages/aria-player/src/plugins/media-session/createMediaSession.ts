import { i18n } from "i18next";
import {
  IntegrationCallbacks,
  IntegrationHandle
} from "../../../../types/plugins";
import { Track } from "../../../../types/tracks";

export default function createMediaSession(
  host: IntegrationCallbacks,
  i18n: i18n
): IntegrationHandle | null {
  const { t } = i18n;

  if (!("mediaSession" in navigator)) {
    return null;
  }
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler("play", host.resume);
  navigator.mediaSession.setActionHandler("pause", host.pause);
  navigator.mediaSession.setActionHandler("stop", host.stop);
  navigator.mediaSession.setActionHandler("nexttrack", host.next);
  navigator.mediaSession.setActionHandler("previoustrack", host.previous);

  const updateMediaSessionMetadata = (track: Track, artwork?: string) => {
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: Array.isArray(track.artist)
          ? track.artist.join("/")
          : (track.artist ?? t("tracks.unknownArtist")),
        album: track.album ?? t("tracks.unknownAlbum"),
        artwork:
          artwork != null && artwork != undefined
            ? [{ src: artwork }]
            : undefined
      });

      navigator.mediaSession.playbackState = "playing";
    }
  };

  return {
    onPlay: (metadata: Track, artwork?: string) => {
      updateMediaSessionMetadata(metadata, artwork);
    },
    onPause: () => {
      navigator.mediaSession.playbackState = "paused";
    },
    onResume: () => {
      navigator.mediaSession.playbackState = "playing";
    },
    onStop: () => {
      navigator.mediaSession.playbackState = "none";
    },
    dispose: () => {
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
      }
    }
  };
}
