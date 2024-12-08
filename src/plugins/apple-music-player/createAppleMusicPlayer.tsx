import { ChangeEvent, useState } from "react";
import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import { Track, TrackMetadata } from "../../features/tracks/tracksTypes";

export type AppleMusicConfig = {
  loggedIn?: boolean;
  developerToken?: string;
};

export default function createAppleMusicPlayer(
  host: SourceCallbacks
): SourceHandle {
  let music: MusicKit.MusicKitInstance;

  const getConfig = () => host.getData() as AppleMusicConfig;

  const script = document.createElement("script");
  script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
  script.async = true;
  document.body.appendChild(script);
  document.addEventListener("musickitloaded", async function () {
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
  });

  function getDeveloperToken() {
    const developerToken = getConfig().developerToken;
    return developerToken && developerToken.trim() !== ""
      ? developerToken
      : import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN;
  }

  async function fetchUserLibrary() {
    let url = "v1/me/library/songs?" as string | null;
    while (url) {
      try {
        const tracksResponse = await music.api.music(url + "&include=albums");
        const { data, next } = (
          tracksResponse as { data: MusicKit.Relationship<MusicKit.Songs> }
        ).data;
        const tracks: TrackMetadata[] = [];
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
        });
        url = next || null;
        if (!music.isAuthorized) return;
        host.updateTracks(tracks);
      } catch (error) {
        console.error("Error fetching user library:", error);
      }
    }
  }

  async function authenticate() {
    await music.authorize();
    host.updateData({ ...getConfig(), loggedIn: true });
    await fetchUserLibrary();
  }

  async function logout() {
    await music.unauthorize();
    host.updateData({ ...getConfig(), loggedIn: false });
    host.removeTracks();
  }

  return {
    displayName: "Apple Music",

    LibraryConfig: (props: { data: object }) => {
      const config = props.data as AppleMusicConfig;

      const [developerToken, setDeveloperToken] = useState(
        config.developerToken ?? ""
      );
      const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

      function updateDeveloperToken(event: ChangeEvent<HTMLInputElement>) {
        setDeveloperToken(event.target.value);
        host.updateData({ ...config, clientId: event.target.value });
      }

      return (
        <div>
          <h3 className="settings-heading">Apple Music settings</h3>
          {!config.loggedIn ? (
            <button className="settings-button" onClick={authenticate}>
              Log in with Apple Music
            </button>
          ) : (
            <button className="settings-button" onClick={logout}>
              Log out from Apple Music
            </button>
          )}
          <p>
            <button
              className="settings-button"
              onClick={() => {
                setShowAdvancedSettings(!showAdvancedSettings);
              }}
            >
              Toggle advanced settings
            </button>
          </p>
          {showAdvancedSettings && (
            <>
              <p>
                Developer Token
                <br />
                <input
                  type="text"
                  value={developerToken}
                  onChange={updateDeveloperToken}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </p>
            </>
          )}
        </div>
      );
    },

    QuickStart: () => (
      <button className="settings-button" onClick={authenticate}>
        Log in with Apple Music
      </button>
    ),

    loadAndPlayTrack: async (track: Track) => {
      await music.setQueue({ song: track.uri });
      await music.play();
    },

    getTrackArtwork: async (track: Track) => {
      return track.artworkUri?.replace("{w}", "1000").replace("{h}", "1000");
    },

    pause: () => {
      music.pause();
    },

    resume: () => {
      music.play();
    },

    setVolume: (volume: number) => {
      (music as unknown as MusicKit.Player).volume = volume / 100;
    },

    setMuted: (muted: boolean) => {
      (music as unknown as MusicKit.Player).volume = muted
        ? 0
        : host.getVolume() / 100;
    },

    setTime: (position: number) => {
      music.seekToTime(position / 1000);
    },

    dispose: () => {
      music.stop();
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      document.removeEventListener("musickitloaded", fetchUserLibrary);
    }
  };
}
