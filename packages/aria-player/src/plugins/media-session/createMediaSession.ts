import { i18n } from "i18next";
import {
  IntegrationCallbacks,
  IntegrationHandle,
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

  // This ensures that the media session remains active even when the player is paused/stopped
  function createSilentAudio(): HTMLAudioElement {
    const audio = document.createElement("audio");
    audio.src =
      "data:audio/wav;base64,UklGRiUAAABXQVZFZm10IBAAAAABAAEAgD4AAAB9AAABAAEAZGF0YQEAAACA";
    audio.loop = true;
    return audio;
  }

  const silentAudio = createSilentAudio();
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler("play", () => {
    host.resume();
    navigator.mediaSession.playbackState = "playing";
    silentAudio.play().catch(() => {});
  });
  navigator.mediaSession.setActionHandler("pause", () => {
    host.pause();
    navigator.mediaSession.playbackState = "paused";
    silentAudio.pause();
  });
  navigator.mediaSession.setActionHandler("stop", () => {
    host.stop();
    navigator.mediaSession.playbackState = "none";
    silentAudio.pause();
  });
  navigator.mediaSession.setActionHandler("nexttrack", host.next);
  navigator.mediaSession.setActionHandler("previoustrack", host.previous);
  navigator.mediaSession.setActionHandler("seekto", (details) => {
    if (details.seekTime != null) {
      host.seek(details.seekTime * 1000);
    }
  });
  navigator.mediaSession.setActionHandler("seekforward", (details) => {
    host.seek(host.getPosition() + (details.seekOffset ?? 10) * 1000);
  });
  navigator.mediaSession.setActionHandler("seekbackward", (details) => {
    host.seek(
      Math.max(0, host.getPosition() - (details.seekOffset ?? 10) * 1000)
    );
  });

  const updatePosition = (position: number, duration?: number | null) => {
    if (!("setPositionState" in navigator.mediaSession)) return;
    try {
      const positionSec = Math.max(0, position / 1000);
      const state: MediaPositionState = {
        position: positionSec,
        playbackRate: 1,
      };
      if (duration != null) {
        state.duration = duration / 1000;
        state.position = Math.min(positionSec, state.duration);
      }
      navigator.mediaSession.setPositionState(state);
    } catch {
      console.error("Failed to update media session position");
    }
  };

  const updateMetadata = (track: Track, artwork?: string) => {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: Array.isArray(track.artist)
        ? track.artist.join("/")
        : (track.artist ?? t("tracks.unknownArtist")),
      album: track.album ?? t("tracks.unknownAlbum"),
      artwork:
        artwork != null && artwork != undefined
          ? [{ src: artwork }]
          : undefined,
    });

    navigator.mediaSession.playbackState = "playing";
  };

  return {
    onPlay: (track: Track, artwork?: string) => {
      updateMetadata(track, artwork);
      updatePosition(0, track.duration);
      silentAudio.play().catch(() => {});
    },
    onPause: () => {
      navigator.mediaSession.playbackState = "paused";
      silentAudio.pause();
    },
    onResume: (positionMs: number, duration?: number | null) => {
      navigator.mediaSession.playbackState = "playing";
      updatePosition(positionMs, duration);
      silentAudio.play().catch(() => {});
    },
    onSeek: (positionMs: number, duration?: number | null) => {
      updatePosition(positionMs, duration);
    },
    onStop: () => {
      navigator.mediaSession.metadata = null;
      navigator.mediaSession.playbackState = "none";
      silentAudio.pause();
    },
    dispose: () => {
      silentAudio.pause();
      silentAudio.removeAttribute("src");
      if ("mediaSession" in navigator) {
        navigator.mediaSession.metadata = null;
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("stop", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("seekto", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
      }
    },
  };
}
