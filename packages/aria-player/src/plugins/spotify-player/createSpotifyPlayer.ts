import LibraryConfig, { showLibrarySetupDialog } from "./LibraryConfig";
import QuickStart from "./QuickStart";
import Attribution from "./Attribution";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import { BASEPATH } from "../../app/constants";
import { isTauri } from "../../app/utils";
import {
  ArtistMetadata,
  SourceCallbacks,
  SourceHandle,
  TrackMetadata,
  TrackUri,
} from "../../../../types";

export type SpotifyConfig = {
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: number;
  clientId?: string;
  redirectUri?: string;
  includeLikedSongs?: boolean;
  includeSavedAlbums?: boolean;
  fetchGenres?: boolean;
  likedSongsCount?: number;
  savedAlbumsCount?: number;
  librarySetupPending?: boolean;
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
      setupSpotifyPlayer();
      const hasSubscription = await checkForSubscription();
      if (!hasSubscription) return;
      await fetchAndStoreLibraryInfo();
      loadTracks();
    }
  }

  function openLibrarySetupDialog() {
    const config = getConfig();
    if (!config.accessToken) return;
    showLibrarySetupDialog({
      host,
      config,
      i18n,
      onSubmit: (includeLikedSongs, includeSavedAlbums, fetchGenres) => {
        host.updateData({
          ...getConfig(),
          includeLikedSongs,
          includeSavedAlbums,
          fetchGenres,
          librarySetupPending: false,
        });
        startLibraryLoad();
      },
    });
  }

  function setupSpotifyPlayer() {
    if (document.getElementById("spotify")) return;
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
        volume: host.getMuted() ? 0 : host.getVolume() / 100,
      });

      player.addListener("ready", ({ device_id }) => {
        deviceId = device_id;
      });

      player.addListener("not_ready", ({ device_id }) => {
        console.error("Device ID has gone offline", device_id);
      });

      player.connect();
    };
  }

  async function fetchAndStoreLibraryInfo() {
    const config = getConfig();
    const includeLikedSongs = config.includeLikedSongs !== false;
    const includeSavedAlbums = config.includeSavedAlbums !== false;
    const [tracksResponse, albumsResponse] = await Promise.all([
      includeLikedSongs
        ? (spotifyRequest(
            `/me/tracks?limit=1`
          ) as Promise<SpotifyApi.UsersSavedTracksResponse>)
        : Promise.resolve(null),
      includeSavedAlbums
        ? (spotifyRequest(
            `/me/albums?limit=1`
          ) as Promise<SpotifyApi.UsersSavedAlbumsResponse>)
        : Promise.resolve(null),
    ]);
    host.updateData({
      ...getConfig(),
      likedSongsCount: tracksResponse?.total ?? getConfig().likedSongsCount,
      savedAlbumsCount: albumsResponse?.total ?? getConfig().savedAlbumsCount,
    });
  }

  function startLibraryLoad() {
    loadTracks();
  }

  function refreshLibrary(configOverride?: Partial<SpotifyConfig>) {
    loadTracks(configOverride);
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
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=${getClientId()}`,
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
      tokenExpiry: Date.now() + responseBody.expires_in * 1000,
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
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
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
    if (!profileResponse) return false;
    if ("status" in profileResponse && profileResponse.status === 403) {
      host.showAlert({
        heading: i18n.t("spotify-player:errorDialog.profileErrorHeading"),
        message: i18n.t("spotify-player:errorDialog.profileErrorMessage"),
        closeLabel: i18n.t("spotify-player:errorDialog.logOut"),
        onClose: () => {
          logout();
        },
      });
      return false;
    }
    if (!("product" in profileResponse)) return false;
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
        },
      });
      return false;
    }
    return true;
  }

  async function loadTracks(configOverride?: Partial<SpotifyConfig>) {
    const config = { ...getConfig(), ...configOverride };
    const includeLikedSongs = config.includeLikedSongs !== false;
    const includeSavedAlbums = config.includeSavedAlbums !== false;
    const fetchGenres = config.fetchGenres !== false;
    const existingTracks = host.getTracks();
    const albumArtistMapping: Record<string, string[]> = {};
    const artistIds = new Set<string>();
    const tracksInLibrary = new Set<string>();
    const tracksLimit = 50;
    const maxConcurrentRequests = 10;
    let progress = 0;
    const totalTracks = includeLikedSongs ? (config.likedSongsCount ?? 0) : 0;
    const totalAlbums = includeSavedAlbums ? (config.savedAlbumsCount ?? 0) : 0;
    const albumProgressMultiplier = 10;

    const incrementProgress = (amount: number) => {
      progress += amount;
      host.setSyncProgress({
        synced: progress,
        total:
          totalTracks +
          totalAlbums * albumProgressMultiplier +
          (fetchGenres ? artistIds.size : 0),
      });
    };

    if (includeLikedSongs) {
      for (
        let offset = 0;
        offset < totalTracks;
        offset += tracksLimit * maxConcurrentRequests
      ) {
        const remaining = totalTracks - offset;
        const requestsInBatch = Math.min(
          maxConcurrentRequests,
          Math.ceil(remaining / tracksLimit)
        );
        const promises = [];
        for (let i = 0; i < requestsInBatch; i++) {
          const currentOffset = offset + i * tracksLimit;
          promises.push(
            spotifyRequest(
              `/me/tracks?limit=${tracksLimit}&offset=${currentOffset}`
            ) as Promise<SpotifyApi.UsersSavedTracksResponse>
          );
        }
        const batchResults = await Promise.all(promises);
        const tracksToAdd = [];
        let itemsFetched = 0;
        for (const tracksResponse of batchResults) {
          if (tracksResponse && tracksResponse.items) {
            itemsFetched += tracksResponse.items.length;
            for (const track of tracksResponse.items) {
              if (track.track.restrictions?.reason) {
                continue;
              }
              const genres = existingTracks.find(
                (existingTrack) =>
                  existingTrack.albumUri == track.track.album.uri
              )?.genre;
              tracksInLibrary.add(track.track.uri);
              const newTrack = getTrackMetadata(
                track.track,
                track.track.album,
                new Date(track.added_at).getTime(),
                genres
              );
              albumArtistMapping[track.track.album.uri] =
                track.track.album.artists.map((artist) => artist.id);
              track.track.artists.forEach((artist) => artistIds.add(artist.id));
              track.track.album.artists.forEach((artist) =>
                artistIds.add(artist.id)
              );
              tracksToAdd.push(newTrack);
            }
          }
        }
        if (!getConfig().accessToken) return;
        host.updateLibraryTracks(tracksToAdd);
        incrementProgress(itemsFetched);
      }
    }
    const albumsLimit = 50;
    if (includeSavedAlbums) {
      for (
        let offset = 0;
        offset < totalAlbums;
        offset += albumsLimit * maxConcurrentRequests
      ) {
        const remaining = totalAlbums - offset;
        const requestsInBatch = Math.min(
          maxConcurrentRequests,
          Math.ceil(remaining / albumsLimit)
        );
        const promises = [];
        for (let i = 0; i < requestsInBatch; i++) {
          const currentOffset = offset + i * albumsLimit;
          promises.push(
            spotifyRequest(
              `/me/albums?limit=${albumsLimit}&offset=${currentOffset}`
            ) as Promise<SpotifyApi.UsersSavedAlbumsResponse>
          );
        }
        const batchResults = await Promise.all(promises);
        const tracksToAdd = [];
        let itemsFetched = 0;
        for (const albumsResponse of batchResults) {
          if (albumsResponse && albumsResponse.items) {
            itemsFetched += albumsResponse.items.length;
            for (const album of albumsResponse.items) {
              const genres = existingTracks.find(
                (track) => track.albumUri == album.album.uri
              )?.genre;
              const tracksFromResponse = album.album.tracks.items
                .filter((track) => !track.restrictions?.reason)
                .map((track) => {
                  tracksInLibrary.add(track.uri);
                  return getTrackMetadata(
                    track,
                    album.album,
                    new Date(album.added_at).getTime(),
                    genres
                  );
                });
              albumArtistMapping[album.album.uri] = album.album.artists.map(
                (artist) => artist.id
              );
              album.album.tracks.items.forEach((track) =>
                track.artists.forEach((artist) => artistIds.add(artist.id))
              );
              album.album.artists.forEach((artist) => artistIds.add(artist.id));
              tracksToAdd.push(...tracksFromResponse);
            }
          }
        }
        if (!getConfig().accessToken) return;
        host.updateLibraryTracks(tracksToAdd);
        incrementProgress(itemsFetched * albumProgressMultiplier);
      }
    }
    const removedTracks = existingTracks.filter(
      (track) => !tracksInLibrary.has(track.uri)
    );
    if (removedTracks.length > 0) {
      host.removeLibraryTracks(removedTracks.map((track) => track.uri));
    }
    if (fetchGenres) {
      const tracks = host
        .getTracks()
        .filter((track) => tracksInLibrary.has(track.uri));
      const existingArtists = host.getArtists();
      const artists = Array.from(artistIds);
      const artistMetadata: ArtistMetadata[] = [];
      const artistGenreMapping: Record<string, string[]> = {};
      const artistBatchSize = 50;
      for (
        let i = 0;
        i < artists.length;
        i += artistBatchSize * maxConcurrentRequests
      ) {
        const requestsInBatch = Math.min(
          maxConcurrentRequests,
          Math.ceil((artists.length - i) / artistBatchSize)
        );
        const promises = [];
        for (let j = 0; j < requestsInBatch; j++) {
          const batchIds = artists
            .slice(i + j * artistBatchSize, i + (j + 1) * artistBatchSize)
            .join(",");
          promises.push(
            spotifyRequest(
              `/artists?ids=${batchIds}`
            ) as Promise<SpotifyApi.MultipleArtistsResponse>
          );
        }
        const batchResults = await Promise.all(promises);
        for (const artistResponse of batchResults) {
          if (artistResponse && artistResponse.artists) {
            for (const artist of artistResponse.artists) {
              artistGenreMapping[artist.id] = artist.genres;
              artistMetadata.push({
                uri: artist.uri,
                name: artist.name,
                artworkUri: artist.images?.[0]?.url,
              });
            }
            incrementProgress(artistResponse.artists.length);
          }
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
        if (!track.albumUri) {
          return track;
        }
        const artistIds = albumArtistMapping[track.albumUri];
        return {
          ...track,
          genre: getUniqueGenresFromArtists(artistIds, artistGenreMapping),
        };
      });
      if (!getConfig().accessToken) return;
      host.updateLibraryTracks(updatedTracks);
    }
  }

  function getTrackMetadata(
    track: SpotifyApi.TrackObjectSimplified,
    album: SpotifyApi.AlbumObjectSimplified,
    dateAdded: number | undefined,
    genre?: string | string[]
  ): TrackMetadata {
    return {
      uri: track.uri,
      title: track.name,
      metadataLoaded: true,
      ...(dateAdded !== undefined && { dateAdded }),
      duration: track.duration_ms,
      artist: track.artists.map((artist) => artist.name),
      artistUri: track.artists.map((artist) => artist.uri),
      albumArtist: album.artists.map((artist) => artist.name),
      albumArtistUri: album.artists.map((artist) => artist.uri),
      album: album.name,
      albumUri: album.uri,
      genre,
      year: parseInt(album.release_date.split("-")[0]),
      dateReleased: new Date(album.release_date).getTime(),
      track: track.track_number,
      disc: track.disc_number,
      artworkUri: album.images[0]?.url,
    };
  }

  async function fetchArtistGenres(
    artistIds: string[]
  ): Promise<Record<string, string[]>> {
    const artistGenreMapping: Record<string, string[]> = {};
    for (let i = 0; i < artistIds.length; i += 50) {
      const batchIds = artistIds.slice(i, i + 50).join(",");
      const artistResponse = (await spotifyRequest(
        `/artists?ids=${batchIds}`
      )) as SpotifyApi.MultipleArtistsResponse;
      if (artistResponse?.artists) {
        for (const artist of artistResponse.artists) {
          artistGenreMapping[artist.id] = artist.genres;
        }
      }
    }
    return artistGenreMapping;
  }

  function getUniqueGenresFromArtists(
    artistIds: string[] | undefined,
    artistGenreMapping: Record<string, string[]>
  ): string[] {
    if (!artistIds) return [];
    const allGenres = artistIds.flatMap(
      (artistId) => artistGenreMapping[artistId] || []
    );
    const uniqueGenres = Array.from(new Set(allGenres));
    return uniqueGenres.map((genre) =>
      genre
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );
  }

  async function authenticate(showLibrarySetupDialog = true) {
    if (!getClientId()) return;

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
      "user-modify-playback-state user-read-playback-state app-remote-control streaming user-library-read user-library-modify user-read-private user-read-email";

    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${getClientId()}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(
      getRedirectUri()
    )}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

    host.openAuthenticationUrl(authUrl);
    window.addEventListener("message", (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }
      if (event.data && event.data.type === "OAuthCode") {
        const code = event.data.code;
        if (code) {
          exchangeCodeForToken(code, codeVerifier, showLibrarySetupDialog);
        }
      }
    });
  }

  async function exchangeCodeForToken(
    code: string,
    codeVerifier: string,
    showLibrarySetupDialog: boolean
  ) {
    try {
      const response = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(
          getRedirectUri()
        )}&client_id=${getClientId()}&code_verifier=${codeVerifier}`,
      });
      const responseBody = await response.json();
      host.updateData({
        ...getConfig(),
        accessToken: responseBody.access_token,
        refreshToken: responseBody.refresh_token,
        tokenExpiry: Date.now() + responseBody.expires_in * 1000,
      });
      setupSpotifyPlayer();
      const hasSubscription = await checkForSubscription();
      if (!hasSubscription) return;
      await fetchAndStoreLibraryInfo();
      if (showLibrarySetupDialog) {
        host.updateData({ ...getConfig(), librarySetupPending: true });
        openLibrarySetupDialog();
      } else {
        host.updateData({ ...getConfig(), librarySetupPending: false });
        startLibraryLoad();
      }
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
      redirectUri: config.redirectUri,
    });
  }

  async function requestTrack(track: TrackMetadata) {
    requestingTrack = true;
    await player?.pause();
    await spotifyRequest(`/me/player/play?device_id=${deviceId}`, "PUT", {
      uris: [track.uri],
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
      LibraryConfig({
        ...props,
        host,
        authenticate,
        logout,
        redirectUri: getRedirectUri(),
        startLibraryLoad,
        refreshLibrary,
        i18n,
      }),

    QuickStart: (props) =>
      QuickStart({
        ...props,
        authenticate,
        config: getConfig(),
        redirectUri: getRedirectUri(),
        updateData: (data) => host.updateData(data),
        i18n,
      }),

    Attribution: (props) => Attribution({ ...props, i18n }),

    async loadAndPlayTrack(track: TrackMetadata) {
      if (!hasTransferredPlayback && deviceId) {
        await spotifyRequest("/me/player", "PUT", {
          device_ids: [deviceId],
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

    async getTrack(uri: TrackUri) {
      const trackId = uri.split(":").pop();
      if (!trackId) {
        throw new Error(`Invalid Spotify track URI: ${uri}`);
      }
      const trackResponse = (await spotifyRequest(
        `/tracks/${trackId}`
      )) as SpotifyApi.SingleTrackResponse;
      if (!trackResponse || trackResponse.restrictions?.reason) {
        return undefined;
      }

      let formattedGenres: string[] | undefined;
      if (getConfig().fetchGenres !== false) {
        const artistIds = new Set<string>();
        trackResponse.artists.forEach((artist) => artistIds.add(artist.id));
        trackResponse.album.artists.forEach((artist) =>
          artistIds.add(artist.id)
        );

        const artistGenreMapping = await fetchArtistGenres(
          Array.from(artistIds)
        );
        const albumArtistIds = trackResponse.album.artists.map(
          (artist) => artist.id
        );
        formattedGenres = getUniqueGenresFromArtists(
          albumArtistIds,
          artistGenreMapping
        );
      }

      return getTrackMetadata(
        trackResponse,
        trackResponse.album,
        undefined,
        formattedGenres
      );
    },

    async getTrackArtwork(artworkUri) {
      return artworkUri;
    },

    async getArtistArtwork(artworkUri) {
      return artworkUri;
    },

    async getAlbumTracks(uri: string) {
      const albumId = uri.split(":").pop();
      if (!albumId) {
        throw new Error(`Invalid Spotify album URI: ${uri}`);
      }

      const albumResponse = (await spotifyRequest(
        `/albums/${albumId}`
      )) as SpotifyApi.SingleAlbumResponse;

      if (!albumResponse) {
        throw new Error(`Failed to fetch album: ${uri}`);
      }

      const tracks: TrackMetadata[] = [];
      const artistIds = new Set<string>();

      let tracksOffset = 0;
      const tracksLimit = 50;
      let hasMore = true;

      while (hasMore) {
        const tracksResponse = (await spotifyRequest(
          `/albums/${albumId}/tracks?limit=${tracksLimit}&offset=${tracksOffset}`
        )) as SpotifyApi.AlbumTracksResponse;

        if (tracksResponse?.items) {
          for (const track of tracksResponse.items) {
            if (track.restrictions?.reason) continue;
            tracks.push(getTrackMetadata(track, albumResponse, undefined));
            track.artists.forEach((artist) => artistIds.add(artist.id));
          }

          hasMore = tracksResponse.items.length === tracksLimit;
          tracksOffset += tracksLimit;
        } else {
          hasMore = false;
        }
      }

      if (getConfig().fetchGenres !== false) {
        const artists = Array.from(artistIds);
        const artistGenreMapping = await fetchArtistGenres(artists);
        const albumArtistIds = albumResponse.artists.map((artist) => artist.id);
        const formattedGenres = getUniqueGenresFromArtists(
          albumArtistIds,
          artistGenreMapping
        );

        return tracks.map((track) => ({
          ...track,
          genre: formattedGenres,
        }));
      }

      return tracks;
    },

    async getArtistInfo(uri: string) {
      const artistId = uri.split(":").pop();
      if (!artistId) {
        throw new Error(`Invalid Spotify artist URI: ${uri}`);
      }

      const artistResponse = (await spotifyRequest(
        `/artists/${artistId}`
      )) as SpotifyApi.SingleArtistResponse;

      if (!artistResponse) {
        return undefined;
      }

      return {
        uri: artistResponse.uri,
        name: artistResponse.name,
        artworkUri: artistResponse.images?.[0]?.url,
      };
    },

    async getArtistTopTracks(
      uri: string,
      startIndex: number,
      stopIndex: number
    ) {
      const artistId = uri.split(":").pop();
      if (!artistId) {
        throw new Error(`Invalid Spotify artist URI: ${uri}`);
      }

      const topTracksResponse = (await spotifyRequest(
        `/artists/${artistId}/top-tracks?market=from_token`
      )) as SpotifyApi.ArtistsTopTracksResponse;

      if (!topTracksResponse?.tracks) {
        return [];
      }

      const requestedTracks = topTracksResponse.tracks.slice(
        startIndex,
        Math.min(stopIndex, 10)
      );
      const tracks: TrackMetadata[] = [];
      const artistIds = new Set<string>();

      for (const track of requestedTracks) {
        if (track.restrictions?.reason) continue;
        tracks.push(getTrackMetadata(track, track.album, undefined));
        track.artists.forEach((artist) => artistIds.add(artist.id));
        track.album.artists.forEach((artist) => artistIds.add(artist.id));
      }

      if (getConfig().fetchGenres !== false) {
        const artists = Array.from(artistIds);
        const artistGenreMapping = await fetchArtistGenres(artists);

        return tracks.map((track) => {
          const albumArtistIds =
            topTracksResponse.tracks
              .find((t) => t.uri === track.uri)
              ?.album.artists.map((artist) => artist.id) ?? [];
          const formattedGenres = getUniqueGenresFromArtists(
            albumArtistIds,
            artistGenreMapping
          );
          return {
            ...track,
            genre: formattedGenres,
          };
        });
      }

      return tracks;
    },

    async getArtistAlbums(uri: string, startIndex: number, stopIndex: number) {
      const artistId = uri.split(":").pop();
      if (!artistId) {
        throw new Error(`Invalid Spotify artist URI: ${uri}`);
      }

      const limit = stopIndex - startIndex;
      const albumsResponse = (await spotifyRequest(
        `/artists/${artistId}/albums?include_groups=album,single&limit=${limit}&offset=${startIndex}`
      )) as SpotifyApi.ArtistsAlbumsResponse;

      if (!albumsResponse?.items) {
        return [];
      }

      return albumsResponse.items.map((album) => ({
        uri: album.uri,
        name: album.name,
        artist: album.artists.map((artist) => artist.name),
        artistUri: album.artists.map((artist) => artist.uri),
        year: album.release_date
          ? parseInt(album.release_date.split("-")[0])
          : undefined,
        dateReleased: album.release_date
          ? new Date(album.release_date).getTime()
          : undefined,
        artworkUri: album.images?.[0]?.url,
      }));
    },

    addTracksToRemoteLibrary: async (tracks: TrackUri[]) => {
      if (!getConfig().accessToken) return;
      const uniqueIds = Array.from(
        new Set(tracks.map((track) => track.split(":").pop()).filter(Boolean))
      ) as string[];
      if (uniqueIds.length === 0) return;
      for (let i = 0; i < uniqueIds.length; i += 50) {
        const batch = uniqueIds.slice(i, i + 50);
        await spotifyRequest("/me/tracks", "PUT", { ids: batch });
      }
    },

    removeTracksFromRemoteLibrary: async (tracks: TrackUri[]) => {
      if (!getConfig().accessToken) return;
      const uniqueIds = Array.from(
        new Set(tracks.map((track) => track.split(":").pop()).filter(Boolean))
      ) as string[];
      if (uniqueIds.length === 0) return;
      for (let i = 0; i < uniqueIds.length; i += 50) {
        const batch = uniqueIds.slice(i, i + 50);
        await spotifyRequest("/me/tracks", "DELETE", { ids: batch });
      }
    },

    get searchTracks() {
      if (!getConfig().accessToken) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const limit = stopIndex - startIndex;
        const searchResponse = (await spotifyRequest(
          `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&offset=${startIndex}`
        )) as SpotifyApi.SearchResponse;

        if (!searchResponse?.tracks?.items) {
          return [];
        }

        const tracks: TrackMetadata[] = [];
        const artistIds = new Set<string>();

        for (const track of searchResponse.tracks.items) {
          if (track.restrictions?.reason) continue;
          tracks.push(getTrackMetadata(track, track.album, undefined));
          track.artists.forEach((artist) => artistIds.add(artist.id));
          track.album.artists.forEach((artist) => artistIds.add(artist.id));
        }

        if (getConfig().fetchGenres !== false) {
          const artists = Array.from(artistIds);
          const artistGenreMapping = await fetchArtistGenres(artists);

          return tracks.map((track) => {
            const albumArtistIds =
              searchResponse.tracks?.items
                .find((t) => t.uri === track.uri)
                ?.album.artists.map((artist) => artist.id) ?? [];
            const formattedGenres = getUniqueGenresFromArtists(
              albumArtistIds,
              artistGenreMapping
            );
            return {
              ...track,
              genre: formattedGenres,
            };
          });
        }

        return tracks;
      };
    },

    get searchAlbums() {
      if (!getConfig().accessToken) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const limit = stopIndex - startIndex;
        const searchResponse = (await spotifyRequest(
          `/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}&offset=${startIndex}`
        )) as SpotifyApi.SearchResponse;

        if (!searchResponse?.albums?.items) {
          return [];
        }

        return searchResponse.albums.items.map((album) => ({
          uri: album.uri,
          name: album.name,
          artist: album.artists.map((artist) => artist.name),
          artistUri: album.artists.map((artist) => artist.uri),
          year: album.release_date
            ? parseInt(album.release_date.split("-")[0])
            : undefined,
          dateReleased: album.release_date
            ? new Date(album.release_date).getTime()
            : undefined,
          artworkUri: album.images?.[0]?.url,
        }));
      };
    },

    get searchArtists() {
      if (!getConfig().accessToken) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const limit = stopIndex - startIndex;
        const searchResponse = (await spotifyRequest(
          `/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}&offset=${startIndex}`
        )) as SpotifyApi.SearchResponse;

        if (!searchResponse?.artists?.items) {
          return [];
        }

        return searchResponse.artists.items.map((artist) => ({
          uri: artist.uri,
          name: artist.name,
          artworkUri: artist.images?.[0]?.url,
        }));
      };
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
      player?.setVolume(host.getMuted() ? 0 : volume / 100);
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
    },
  };
}
