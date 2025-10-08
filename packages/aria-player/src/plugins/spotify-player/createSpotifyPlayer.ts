import { TrackMetadata, ArtistMetadata } from "../../../../types/tracks";
import { SourceCallbacks, SourceHandle } from "../../../../types/plugins";
import LibraryConfig from "./LibraryConfig";
import QuickStart from "./QuickStart";
import { createElement } from "react";
import Attribution from "./Attribution";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import { Trans } from "react-i18next";
import { BASEPATH } from "../../app/constants";
import { isTauri } from "../../app/utils";
import styles from "./spotify.module.css";

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
  let requestTimeout: NodeJS.Timeout | null;
  let requestingTrack = false;
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
      : (import.meta.env.VITE_SPOTIFY_REDIRECT_URI ??
          (isTauri()
            ? "http://127.0.0.1:2742/"
            : window.location.origin + BASEPATH));
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
    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
      });
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitTime = retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000;
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else if (
        response.status !== 204 &&
        response.headers.get("content-type")?.includes("application/json")
      ) {
        return await response.json();
      }
      return response;
    }
  }

  async function checkForSubscription() {
    const profileResponse = (await spotifyRequest(
      `/me/`
    )) as SpotifyApi.CurrentUsersProfileResponse;
    if ("status" in profileResponse && profileResponse.status === 403) {
      host.showAlert({
        heading: i18n.t("spotify-player:errorDialog.profileErrorHeading"),
        message: i18n.t("spotify-player:errorDialog.profileErrorMessage"),
        closeLabel: i18n.t("spotify-player:errorDialog.logOut"),
        onClose: () => {
          logout();
        }
      });
      return;
    }
    if (
      profileResponse.product === "free" ||
      profileResponse.product === "open"
    ) {
      host.showAlert({
        heading: i18n.t("spotify-player:errorDialog.premiumRequiredHeading"),
        message: i18n.t("spotify-player:errorDialog.premiumRequiredMessage"),
        closeLabel: i18n.t("spotify-player:errorDialog.logOut"),
        onClose: () => {
          logout();
        }
      });
    }
  }

  async function loadTracks() {
    const existingTracks = host.getTracks();
    const albumArtistMapping: Record<string, string[]> = {};
    const artistIds = new Set<string>();
    const tracksInLibrary: string[] = [];
    const tracksLimit = 50;
    let tracksOffset = 0;
    let tracksRemaining = true;
    let progress = 0;
    // TODO: Possibly refactor to make use of initial response data
    const [totalTracksResponse, totalAlbumsResponse] = await Promise.all([
      spotifyRequest(
        `/me/tracks?limit=1`
      ) as Promise<SpotifyApi.UsersSavedTracksResponse>,
      spotifyRequest(
        `/me/albums?limit=1`
      ) as Promise<SpotifyApi.UsersSavedAlbumsResponse>
    ]);
    const totalTracks = totalTracksResponse?.total || 0;
    const totalAlbums = totalAlbumsResponse?.total || 0;

    const incrementProgress = (amount: number) => {
      progress += amount;
      host.setSyncProgress({
        synced: progress,
        total: totalTracks + totalAlbums + artistIds.size
      });
    };

    while (tracksRemaining) {
      const tracksResponse = (await spotifyRequest(
        `/me/tracks?limit=${tracksLimit}&offset=${tracksOffset}`
      )) as SpotifyApi.UsersSavedTracksResponse;
      if (tracksResponse && tracksResponse.items) {
        const tracksToAdd = [];
        for (const track of tracksResponse.items) {
          if (track.track.restrictions?.reason) {
            continue;
          }
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
            artistUri: track.track.artists.map((artist) => artist.uri),
            albumArtist: track.track.album.artists.map((artist) => artist.name),
            albumArtistUri: track.track.album.artists.map(
              (artist) => artist.uri
            ),
            album: track.track.album.name,
            albumId: track.track.album.id,
            genre: genres,
            year: parseInt(track.track.album.release_date.split("-")[0]),
            track: track.track.track_number,
            disc: track.track.disc_number,
            artworkUri: track.track.album.images[0].url
          };
          albumArtistMapping[track.track.album.id] =
            track.track.album.artists.map((artist) => artist.id);
          track.track.artists.forEach((artist) => artistIds.add(artist.id));
          track.track.album.artists.forEach((artist) =>
            artistIds.add(artist.id)
          );
          tracksToAdd.push(newTrack);
        }
        if (!getConfig().accessToken) return;
        host.updateTracks(tracksToAdd);
        incrementProgress(tracksResponse.items.length);
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
            .filter(
              (track) =>
                !tracksInLibrary.includes(track.uri) &&
                !track.restrictions?.reason
            )
            .map((track) => {
              tracksInLibrary.push(track.uri);
              return {
                uri: track.uri,
                title: track.name,
                metadataLoaded: true,
                dateAdded: new Date(album.added_at).getTime(),
                duration: track.duration_ms,
                artist: track.artists.map((artist) => artist.name),
                artistUri: track.artists.map((artist) => artist.uri),
                albumArtist: album.album.artists.map((artist) => artist.name),
                albumArtistUri: album.album.artists.map((artist) => artist.uri),
                album: album.album.name,
                albumId: album.album.id,
                genre: genres,
                year: parseInt(album.album.release_date.split("-")[0]),
                track: track.track_number,
                disc: track.disc_number,
                artworkUri: album.album.images[0].url
              };
            });
          albumArtistMapping[album.album.id] = album.album.artists.map(
            (artist) => artist.id
          );
          album.album.tracks.items.forEach((track) =>
            track.artists.forEach((artist) => artistIds.add(artist.id))
          );
          album.album.artists.forEach((artist) => artistIds.add(artist.id));
          tracksToAdd.push(...tracksFromResponse);
        }
        if (!getConfig().accessToken) return;
        host.updateTracks(tracksToAdd);
        incrementProgress(albumsResponse.items.length);
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
    const existingArtists = host.getArtists();
    const artists = Array.from(artistIds);
    const artistGenreMapping: Record<string, string[]> = {};
    const artistMetadata: ArtistMetadata[] = [];
    for (let i = 0; i < artists.length; i += 50) {
      const batchIds = artists.slice(i, i + 50).join(",");
      const artistResponse = (await spotifyRequest(
        `/artists?ids=${batchIds}`
      )) as SpotifyApi.MultipleArtistsResponse;
      if (artistResponse && artistResponse.artists) {
        for (const artist of artistResponse.artists) {
          artistGenreMapping[artist.id] = artist.genres;
          artistMetadata.push({
            uri: artist.uri,
            name: artist.name,
            artworkUri: artist.images?.[0]?.url
          });
        }
        incrementProgress(artistResponse.artists.length);
      }
    }
    host.updateArtists(artistMetadata);
    const currentArtistUris = new Set(artistMetadata.map((a) => a.uri));
    const removedArtists = existingArtists
      .filter((artist) => !currentArtistUris.has(artist.uri))
      .map((artist) => artist.uri);
    if (removedArtists.length > 0) {
      host.removeArtists(removedArtists);
    }
    const updatedTracks = tracks.map((track) => {
      if (!track.albumId) {
        return track;
      }
      const artistIds = albumArtistMapping[track.albumId];
      const allGenres = artistIds.flatMap(
        (artistId) => artistGenreMapping[artistId] || []
      );
      const uniqueGenres = Array.from(new Set(allGenres));
      const formattedGenres = uniqueGenres.map((genre) =>
        genre
          .split(" ")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      );
      return { ...track, genre: formattedGenres };
    });
    if (!getConfig().accessToken) return;
    host.updateTracks(updatedTracks);
  }

  async function authenticate() {
    if (!getClientId()) {
      host.showAlert({
        heading: i18n.t("spotify-player:errorDialog.clientIdRequiredHeading"),
        message: () =>
          createElement(Trans, {
            i18nKey: "spotify-player:errorDialog.clientIdRequiredMessage",
            components: {
              uri: createElement(
                "span",
                { className: styles.uri },
                isTauri()
                  ? "http://127.0.0.1:2742/"
                  : window.location.origin + BASEPATH
              )
            }
          }),
        closeLabel: i18n.t("spotify-player:errorDialog.close")
      });
      return;
    }

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
      "user-modify-playback-state user-read-playback-state app-remote-control streaming user-library-read user-read-private user-read-email";

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
    host.setSyncProgress({ synced: 0, total: 0 });
    host.removeTracks();
    host.removeArtists();
    const config = getConfig();
    host.updateData({
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiry: undefined,
      clientId: config.clientId,
      redirectUri: config.redirectUri
    });
  }

  async function requestTrack(track: TrackMetadata) {
    requestingTrack = true;
    await player?.pause();
    await spotifyRequest(`/me/player/play?device_id=${deviceId}`, "PUT", {
      uris: [track.uri]
    });
    return new Promise<void>((resolve) => {
      const onPlaybackStateChanged = (event: Spotify.PlaybackState) => {
        if (
          (event.track_window.current_track.linked_from.uri ??
            event.track_window.current_track.uri) == track.uri &&
          event.loading == false
        ) {
          player?.removeListener(
            "player_state_changed",
            onPlaybackStateChanged
          );
          requestingTrack = false;
          resolve();
        }
      };
      player?.addListener("player_state_changed", onPlaybackStateChanged);
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
      if (!requestingTrack) {
        return await requestTrack(track);
      } else {
        return new Promise<void>((resolve) => {
          if (requestTimeout) clearTimeout(requestTimeout);
          requestTimeout = setTimeout(async () => {
            await requestTrack(track);
            resolve();
          }, 500);
        });
      }
    },

    async getTrackArtwork(track) {
      return track.artworkUri;
    },

    async getArtistArtwork(artist) {
      return artist.artworkUri;
    },

    pause() {
      player?.pause();
    },

    resume() {
      if (!requestingTrack) {
        player?.resume();
      }
    },

    setVolume(volume: number) {
      player?.setVolume(volume / 100);
    },

    setMuted(muted: boolean) {
      player?.setVolume(muted ? 0 : host.getVolume() / 100);
    },

    setTime(time: number) {
      player?.seek(Math.round(time));
    },

    dispose() {
      logout();
      const script = document.getElementById("spotify");
      script?.remove();
      i18n.removeResourceBundle("en-US", "spotify-player");
    }
  };
}
