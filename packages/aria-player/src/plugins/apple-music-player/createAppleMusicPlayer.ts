import { i18n } from "i18next";
import { SourceCallbacks, SourceHandle } from "../../../../types/plugins";
import { Track, TrackMetadata } from "../../../../types/tracks";
import LibraryConfig from "./LibraryConfig";
import QuickStart from "./QuickStart";
import en_us from "./locales/en_us/translation.json";

export type AppleMusicConfig = {
  loggedIn?: boolean;
  developerToken?: string;
};

export default function createAppleMusicPlayer(
  host: SourceCallbacks,
  i18n: i18n
): SourceHandle {
  i18n.addResourceBundle("en-US", "apple-music-player", en_us);

  let music: MusicKit.MusicKitInstance | undefined;

  const getConfig = () => host.getData() as AppleMusicConfig;

  const script = document.createElement("script");
  script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
  script.async = true;
  document.body.appendChild(script);
  document.addEventListener("musickitloaded", initialize);

  async function initialize() {
    const musicKitConfig = {
      developerToken: getDeveloperToken(),
      app: {
        name: "Aria",
        build: "1.0.0"
      }
    };
    await window.MusicKit.configure(musicKitConfig);
    music = await window.MusicKit.getInstance();
    if (music.isAuthorized) {
      fetchUserLibrary();
    }
  }

  function getDeveloperToken() {
    const developerToken = getConfig().developerToken;
    return developerToken && developerToken.trim() !== ""
      ? developerToken
      : import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
  }

  async function fetchUserLibrary() {
    const existingTracks = host.getTracks();
    const tracksInLibrary: string[] = [];
    let url = "v1/me/library/songs?" as string | null;
    let progress = 0;
    while (url) {
      try {
        const tracksResponse = await music?.api.music(
          url + "&sort=-dateAdded&include=albums"
        );
        const { data, meta, next } = (
          tracksResponse as { data: MusicKit.Relationship<MusicKit.Songs> }
        ).data;
        const tracks: TrackMetadata[] = [];
        progress += data.length;
        host.setSyncProgress({
          synced: progress,
          total: meta?.total
        });
        data.forEach((track) => {
          const albumData = track.relationships?.albums
            .data[0] as unknown as MusicKit.LibraryAlbums;
          const trackMetadata = {
            uri: track.id,
            title: track.attributes?.name,
            artist: track.attributes?.artistName,
            albumArtist: albumData.attributes?.artistName,
            album: track.attributes?.albumName,
            albumId: albumData.id,
            genre: track.attributes?.genreNames,
            duration: track.attributes?.durationInMillis,
            artworkUri: track.attributes?.artwork?.url,
            disc: track.attributes?.discNumber,
            track: track.attributes?.trackNumber,
            dateAdded:
              albumData.attributes?.dateAdded &&
              new Date(albumData.attributes?.dateAdded).getTime(),
            year:
              albumData?.attributes?.releaseDate &&
              parseInt(albumData?.attributes?.releaseDate?.split("-")[0]),
            metadataLoaded: true
          } as TrackMetadata;
          tracks.push(trackMetadata);
          tracksInLibrary.push(track.id);
        });
        url = next || null;
        if (!music?.isAuthorized) return;
        host.updateTracks(tracks);
      } catch (error) {
        console.error("Error fetching user library:", error);
      }
    }
    const removedTracks = existingTracks.filter(
      (track) => !tracksInLibrary.includes(track.uri)
    );
    if (removedTracks.length > 0) {
      host.removeTracks(removedTracks.map((track) => track.uri));
    }
  }

  async function authenticate() {
    if (!getDeveloperToken()) {
      host.showAlert({
        heading: i18n.t(
          "apple-music-player:errorDialog.developerTokenRequiredHeading"
        ),
        message: i18n.t(
          "apple-music-player:errorDialog.developerTokenRequiredMessage"
        ),
        closeLabel: i18n.t("apple-music-player:errorDialog.close")
      });
      return;
    }
    if (!music) {
      host.showAlert({
        heading: i18n.t("apple-music-player:errorDialog.musicKitErrorHeading"),
        message: i18n.t("apple-music-player:errorDialog.musicKitErrorMessage"),
        closeLabel: i18n.t("apple-music-player:errorDialog.close")
      });
      return;
    }
    await music?.authorize();
    if (!music?.isAuthorized) return;
    host.updateData({ ...getConfig(), loggedIn: true });
    await fetchUserLibrary();
  }

  async function logout() {
    await music?.unauthorize();
    host.updateData({ ...getConfig(), loggedIn: false });
    host.setSyncProgress({ synced: 0, total: 0 });
    host.removeTracks();
  }

  return {
    displayName: "Apple Music",

    LibraryConfig: (props) =>
      LibraryConfig({ ...props, host, authenticate, logout, i18n }),

    QuickStart: (props) => QuickStart({ ...props, authenticate, i18n }),

    loadAndPlayTrack: async (track: Track) => {
      await music?.setQueue({ song: track.uri });
      await music?.play();
    },

    getTrackArtwork: async (track: Track) => {
      return track.artworkUri?.replace("{w}", "1000").replace("{h}", "1000");
    },

    pause: () => {
      music?.pause();
    },

    resume: () => {
      music?.play();
    },

    setVolume: (volume: number) => {
      if (music) {
        (music as unknown as MusicKit.Player).volume = volume / 100;
      }
    },

    setMuted: (muted: boolean) => {
      if (music) {
        (music as unknown as MusicKit.Player).volume = muted
          ? 0
          : host.getVolume() / 100;
      }
    },

    setTime: (position: number) => {
      music?.seekToTime(position / 1000);
    },

    onDataUpdate: (data) => {
      if (!music && (data as AppleMusicConfig).developerToken) {
        initialize();
      }
    },

    dispose: () => {
      music?.stop();
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      document.removeEventListener("musickitloaded", fetchUserLibrary);
      i18n.removeResourceBundle("en-US", "apple-music-player");
    }
  };
}
