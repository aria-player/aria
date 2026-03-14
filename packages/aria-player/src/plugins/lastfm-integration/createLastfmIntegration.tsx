import LastfmConfig from "./LastfmConfig";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import {
  IntegrationCallbacks,
  IntegrationHandle,
  Track,
} from "../../../../types";
import { authenticate, LastfmData, logout, trackRequest } from "./api";

export default function createLastfmIntegration(
  host: IntegrationCallbacks,
  i18n: i18n
): IntegrationHandle {
  i18n.addResourceBundle("en-US", "lastfm-integration", en_us);

  const getConfig = () => host.getData() as LastfmData;

  let currentTrack: Track | null = null;
  let trackStartedAt = 0;
  let resumedAt = 0;
  let totalPlayTimeMs = 0;
  let isPlaying = false;

  function storeElapsedTime() {
    if (!isPlaying) return;
    totalPlayTimeMs += Date.now() - resumedAt;
    resumedAt = Date.now();
  }

  function tryScrobble() {
    if (!currentTrack) return;
    storeElapsedTime();
    isPlaying = false;
    const { duration } = currentTrack;
    // See https://www.last.fm/api/scrobbling#when-is-a-scrobble-a-scrobble
    const minPlayedMs =
      duration != null ? Math.min(duration * 0.5, 240_000) : 240_000;
    if (
      (duration == null || duration > 30_000) &&
      totalPlayTimeMs >= minPlayedMs
    ) {
      trackRequest("track.scrobble", currentTrack, getConfig(), {
        timestamp: String(trackStartedAt),
      });
    }
    currentTrack = null;
  }

  return {
    Config(props: { data: object }) {
      return (
        <LastfmConfig
          data={props.data}
          host={host}
          authenticate={() => authenticate(getConfig, host, i18n)}
          logout={() => logout(host)}
          i18n={i18n}
        />
      );
    },

    onPlay(metadata: Track) {
      tryScrobble();
      currentTrack = metadata;
      trackStartedAt = Math.floor(Date.now() / 1000);
      resumedAt = Date.now();
      totalPlayTimeMs = 0;
      isPlaying = true;
      trackRequest("track.updateNowPlaying", metadata, getConfig());
    },

    onPause() {
      storeElapsedTime();
      isPlaying = false;
    },

    onResume() {
      resumedAt = Date.now();
      isPlaying = true;
    },

    onSeek() {
      storeElapsedTime();
    },

    onStop() {
      tryScrobble();
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "lastfm-integration");
    },
  };
}
