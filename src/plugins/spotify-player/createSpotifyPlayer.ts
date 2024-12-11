import { TrackMetadata } from "../../features/tracks/tracksTypes";
import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import LibraryConfig from "./LibraryConfig";
import QuickStart from "./QuickStart";
import { createRoot } from "react-dom/client";
import ErrorDialog from "./ErrorDialog";
import { createElement } from "react";
import Attribution from "./Attribution";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";

export type SpotifyConfig = {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  clientId?: string;
  redirectUri?: string;
};

export default function createSpotifyPlayer(
  host: SourceCallbacks,
  i18n: i18n
): SourceHandle {
  i18n.addResourceBundle("en-US", "spotify-player", en_us);
  let player: Spotify.Player | null;
  let deviceId: string | null;
  let hasTransferredPlayback = false;

  const getConfig = () => host.getData() as SpotifyConfig;

  initialize();

  async function initialize() {
    if (getConfig().accessToken) {
      const script = document.createElement("script");
      script.id = "spotify";
      script.src = "https://sdk.scdn.co/spotify-player.js";
      script.async = true;
      document.body.appendChild(script);

      window.onSpotifyWebPlaybackSDKReady = async () => {
        player = new Spotify.Player({
          name: "Aria",
          getOAuthToken: async (cb: (token: string) => void) => {
            cb((await getOrRefreshAccessToken())!);
          },
          volume: host.getVolume() / 100
        });

        player.addListener("ready", ({ device_id }) => {
          deviceId = device_id;
        });

        player.addListener("not_ready", ({ device_id }) => {
          console.error("Device ID has gone offline", device_id);
        });

        player.connect();
      };

      await checkForSubscription();
      loadTracks();
    }
  }

  function getClientId() {
    const clientId = getConfig().clientId;
    return clientId && clientId.trim() !== ""
      ? clientId
      : import.meta.env.VITE_SPOTIFY_CLIENT_ID;
  }

  function getRedirectUri() {
    const redirectUri = getConfig().redirectUri;
    return redirectUri && redirectUri.trim() !== ""
      ? redirectUri
      : import.meta.env.VITE_SPOTIFY_REDIRECT_URI;
  }

  async function getOrRefreshAccessToken() {
    const expiryTime = getConfig().tokenExpiry;
    if (!expiryTime) return;
    if (Date.now() > Number(expiryTime)) {
      await refreshToken();
    }
    return getConfig().accessToken;
  }

  async function refreshToken() {
    const refresh_token = getConfig()?.refreshToken;
    if (!refresh_token) return;
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${getClientId()}`
    });
    const responseBody = await response.json();
    if (!response.ok) {
      console.error("Failed to refresh token:", responseBody);
      throw new Error(`Failed to refresh token. Status: ${response.status}`);
    }
    host.updateData({
      ...getConfig(),
      accessToken: responseBody.access_token,
      refreshToken: responseBody.refresh_token,
      tokenExpiry: Date.now() + responseBody.expires_in * 1000
    });
  }

  async function spotifyRequest(
    endpoint: string,
    method = "GET",
    body?: Record<string, string | string[]>
  ) {
    const token = await getOrRefreshAccessToken();
    if (!token) return;
    const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
      method: method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (
      response.status !== 204 &&
      response.headers.get("content-type")?.includes("application/json")
    ) {
      return await response.json();
    }
    return response;
  }

  async function checkForSubscription() {
    const profileResponse = (await spotifyRequest(
      `/me/`
    )) as SpotifyApi.CurrentUsersProfileResponse;
    if (
      profileResponse.product === "free" ||
      profileResponse.product === "open"
    ) {
      const mainView = document.getElementsByClassName("main-view")[0];
      if (!mainView) return;
      if (document.getElementById("spotify-error-dialog")) return;

      const dialogContainer = document.createElement("div");
      dialogContainer.id = "spotify-error-dialog";
      mainView.appendChild(dialogContainer);

      const root = createRoot(dialogContainer);
      root.render(
        createElement(ErrorDialog, {
          onClose: () => {
            logout();
            root.unmount();
            mainView.removeChild(dialogContainer);
          },
          i18n
        })
      );
    }
  }

  async function loadTracks() {
    const existingTracks = host.getTracks();
    const albumArtistMapping: Record<string, string> = {};
    const tracksInLibrary: string[] = [];
    const tracksLimit = 50;
    let tracksOffset = 0;
    let tracksRemaining = true;
    while (tracksRemaining) {
      const tracksResponse = (await spotifyRequest(
        `/me/tracks?limit=${tracksLimit}&offset=${tracksOffset}`
      )) as SpotifyApi.UsersSavedTracksResponse;
      if (tracksResponse && tracksResponse.items) {
        const tracksToAdd = [];
        for (const track of tracksResponse.items) {
          const genres = existingTracks.find(
            (existingTrack) => existingTrack.albumId == track.track.album.id
          )?.genre;
          tracksInLibrary.push(track.track.uri);
          const newTrack = {
            uri: track.track.uri,
            title: track.track.name,
            metadataLoaded: true,
            dateAdded: new Date(track.added_at).getTime(),
            duration: track.track.duration_ms,
            artist: track.track.artists.map((artist) => artist.name),
            albumArtist: track.track.album.artists
              .map((artist) => artist.name)
              .join("/"),
            album: track.track.album.name,
            albumId: track.track.album.id,
            genre: genres,
            year: parseInt(track.track.album.release_date.split("-")[0]),
            track: track.track.track_number,
            disc: track.track.disc_number,
            artworkUri: track.track.album.images[0].url
          };
          albumArtistMapping[track.track.album.id] =
            track.track.album.artists[0].id;
          tracksToAdd.push(newTrack);
        }
        if (!getConfig().accessToken) return;
        host.updateTracks(tracksToAdd);
        if (tracksResponse.items.length < tracksLimit) {
          tracksRemaining = false;
        } else {
          tracksOffset += tracksLimit;
        }
      } else {
        tracksRemaining = false;
      }
    }
    const albumsLimit = 50;
    let albumsOffset = 0;
    let albumsRemaining = true;
    while (albumsRemaining) {
      const albumsResponse = (await spotifyRequest(
        `/me/albums?limit=${albumsLimit}&offset=${albumsOffset}`
      )) as SpotifyApi.UsersSavedAlbumsResponse;
      if (albumsResponse && albumsResponse.items) {
        const tracksToAdd = [];
        for (const album of albumsResponse.items) {
          const genres = existingTracks.find(
            (track) => track.albumId == album.album.id
          )?.genre;
          const tracksFromResponse = album.album.tracks.items
            .filter((track) => !tracksInLibrary.includes(track.uri))
            .map((track) => {
              tracksInLibrary.push(track.uri);
              return {
                uri: track.uri,
                title: track.name,
                metadataLoaded: true,
                dateAdded: new Date(album.added_at).getTime(),
                duration: track.duration_ms,
                artist: track.artists.map((artist) => artist.name),
                albumArtist: album.album.artists
                  .map((artist) => artist.name)
                  .join("/"),
                album: album.album.name,
                albumId: album.album.id,
                genre: genres,
                year: parseInt(album.album.release_date.split("-")[0]),
                track: track.track_number,
                disc: track.disc_number,
                artworkUri: album.album.images[0].url
              };
            });
          albumArtistMapping[album.album.id] = album.album.artists[0].id;
          tracksToAdd.push(...tracksFromResponse);
        }
        host.updateTracks(tracksToAdd);
        if (albumsResponse.items.length < albumsLimit) {
          albumsRemaining = false;
        } else {
          albumsOffset += albumsLimit;
        }
      } else {
        albumsRemaining = false;
      }
    }
    const removedTracks = existingTracks.filter(
      (track) => !tracksInLibrary.includes(track.uri)
    );
    if (removedTracks.length > 0) {
      host.removeTracks(removedTracks.map((track) => track.uri));
    }
    const tracks = host.getTracks();
    const artists = Array.from(new Set(Object.values(albumArtistMapping)));
    const artistGenreMapping: Record<string, string[]> = {};
    for (let i = 0; i < artists.length; i += 50) {
      const batchIds = artists.slice(i, i + 50).join(",");
      const artistResponse = (await spotifyRequest(
        `/artists?ids=${batchIds}`
      )) as SpotifyApi.MultipleArtistsResponse;
      if (artistResponse && artistResponse.artists) {
        for (const artist of artistResponse.artists) {
          artistGenreMapping[artist.id] = artist.genres;
        }
      }
    }
    const updatedTracks = tracks.map((track) => {
      if (!track.albumId) {
        return track;
      }
      const artist = albumArtistMapping[track.albumId];
      const formattedGenres = artistGenreMapping[artist].map((genre) =>
        genre
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      );
      return { ...track, genre: formattedGenres };
    });
    host.updateTracks(updatedTracks);
  }

  async function authenticate() {
    function generateRandomString(length: number) {
      let text = "";
      const possible =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
      }
      return text;
    }

    async function generateCodeChallenge(codeVerifier: string) {
      function base64encode(buffer: ArrayBuffer) {
        return btoa(String.fromCharCode(...new Uint8Array(buffer)))
          .replace(/\+/g, "-")
          .replace(/\//g, "_")
          .replace(/=+$/, "");
      }
      const encoder = new TextEncoder();
      const data = encoder.encode(codeVerifier);
      const digest = await window.crypto.subtle.digest("SHA-256", data);
      return base64encode(digest);
    }

    const scopes =
      "user-modify-playback-state user-read-playback-state app-remote-control streaming user-library-read user-read-private";

    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authWindow = window.open(
      `https://accounts.spotify.com/authorize?response_type=code&client_id=${getClientId()}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
        getRedirectUri()
      )}&code_challenge_method=S256&code_challenge=${codeChallenge}`,
      "_blank"
    );

    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data && event.data.type === "OAuthCode") {
        const code = event.data.code;
        if (code) {
          authWindow?.close();
          exchangeCodeForToken(code, codeVerifier);
        }
      }
    });
  }

  async function exchangeCodeForToken(code: string, codeVerifier: string) {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(
          getRedirectUri()
        )}&client_id=${getClientId()}&code_verifier=${codeVerifier}`
      });
      const responseBody = await response.json();
      host.updateData({
        ...getConfig(),
        accessToken: responseBody.access_token,
        refreshToken: responseBody.refresh_token,
        tokenExpiry: Date.now() + responseBody.expires_in * 1000
      });
      initialize();
    } catch (error) {
      console.error("Error exchanging code for token:", error);
    }
  }

  function logout() {
    if (player) {
      player.disconnect();
    }
    host.removeTracks();
    const config = getConfig();
    host.updateData({
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiry: undefined,
      clientId: config.clientId,
      redirectUri: config.redirectUri
    });
  }

  return {
    LibraryConfig: (props) =>
      LibraryConfig({ ...props, host, authenticate, logout, i18n }),

    QuickStart: (props) => QuickStart({ ...props, authenticate, i18n }),

    Attribution: (props) => Attribution({ ...props, i18n }),

    async loadAndPlayTrack(track: TrackMetadata) {
      if (!hasTransferredPlayback && deviceId) {
        await spotifyRequest("/me/player", "PUT", {
          device_ids: [deviceId]
        }).catch((error) => {
          console.error("Error setting device ID:", error);
        });
        hasTransferredPlayback = true;
      }
      await spotifyRequest(`/me/player/play?device_id=${deviceId}`, "PUT", {
        uris: [track.uri]
      });
    },

    async getTrackArtwork(track) {
      return track.artworkUri;
    },

    pause() {
      spotifyRequest(`/me/player/pause?device_id=${deviceId}`, "PUT");
    },

    resume() {
      spotifyRequest(`/me/player/play?device_id=${deviceId}`, "PUT");
    },

    setVolume(volume: number) {
      spotifyRequest(
        `/me/player/volume?device_id=${deviceId}&volume_percent=${Math.floor(volume)}`,
        "PUT"
      );
    },

    setMuted(muted: boolean) {
      spotifyRequest(
        `/me/player/volume?device_id=${deviceId}&volume_percent=${muted ? 0 : host.getVolume()}`,
        "PUT"
      );
    },

    setTime(time: number) {
      spotifyRequest(
        `/me/player/seek?device_id=${deviceId}&position_ms=${Math.round(time)}`,
        "PUT"
      );
    },

    dispose() {
      logout();
      const script = document.getElementById("spotify");
      script?.remove();
    }
  };
}
