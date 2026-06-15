import LibraryConfig, { showLibrarySetupDialog } from "./LibraryConfig";
import QuickStart from "./QuickStart";
import Attribution from "./Attribution";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import { BASEPATH } from "../../app/constants";
import { isTauri } from "../../app/utils";
import {
  ArtistMetadata,
  ExternalPlaylistInfo,
  PlaylistPermissions,
  ExternalPlaylistsCallbacks,
  ExternalPlaylistsHandle,
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
  includeOwnPlaylists?: boolean;
  includeFollowedPlaylists?: boolean;
  likedSongsCount?: number;
  savedAlbumsCount?: number;
  ownPlaylistsCount?: number;
  followedPlaylistsCount?: number;
  librarySetupPending?: boolean;
  disableInitialSync?: boolean;
};

export const LIKED_SONGS_PLAYLIST_ID = "liked-songs";
const TOKEN_EXPIRY_BUFFER = 60 * 1000;

export default function createSpotifyPlayer(
  host: SourceCallbacks & ExternalPlaylistsCallbacks,
  i18n: i18n
): SourceHandle & ExternalPlaylistsHandle {
  i18n.addResourceBundle("en-US", "spotify-player", en_us);
  let player: Spotify.Player | null;
  let deviceId: string | null;
  let requestTimeout: NodeJS.Timeout | null;
  let requestingTrack = false;
  let hasTransferredPlayback = false;
  let refreshPromise: Promise<void> | null = null;

  const PLAY_ATTEMPTS = 3;
  const PLAY_CONFIRM_TIMEOUT = 5000;

  const getConfig = () => host.getData() as SpotifyConfig;

  initialize();

  async function initialize() {
    const config = getConfig();
    if (config.accessToken) {
      setupSpotifyPlayer();
      if (config.disableInitialSync) return;
      const hasSubscription = await checkForSubscription();
      if (!hasSubscription) return;
      await fetchAndStoreLibraryInfo();
      startLibraryLoad();
    }
  }

  function openLibrarySetupDialog() {
    const config = getConfig();
    if (!config.accessToken) return;
    showLibrarySetupDialog({
      host,
      config,
      i18n,
      onSubmit: (selection) => {
        host.updateData({
          ...getConfig(),
          ...selection,
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
        deviceId = null;
        hasTransferredPlayback = false;
        player?.connect();
      });

      player.addListener("authentication_error", ({ message }) => {
        console.error("Spotify authentication error:", message);
      });

      player.addListener("account_error", () => {
        host.showAlert({
          heading: i18n.t("spotify-player:errorDialog.premiumRequiredHeading"),
          message: i18n.t("spotify-player:errorDialog.premiumRequiredMessage"),
          closeLabel: i18n.t("spotify-player:errorDialog.logOut"),
          onClose: logout,
        });
      });

      player.addListener("playback_error", ({ message }) => {
        console.error("Spotify playback error:", message);
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
    loadPlaylists();
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
    if (Date.now() > Number(expiryTime) - TOKEN_EXPIRY_BUFFER) {
      await refreshToken();
    }
    return getConfig().accessToken;
  }

  function refreshToken() {
    if (!refreshPromise) {
      refreshPromise = performTokenRefresh().finally(() => {
        refreshPromise = null;
      });
    }
    return refreshPromise;
  }

  async function performTokenRefresh() {
    const refresh_token = getConfig()?.refreshToken;
    if (!refresh_token) return;
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(
        refresh_token
      )}&client_id=${getClientId()}`,
    });
    const responseBody = await response.json();
    if (!response.ok) {
      console.error("Failed to refresh token:", responseBody);
      throw new Error(`Failed to refresh token. Status: ${response.status}`);
    }
    host.updateData({
      ...getConfig(),
      accessToken: responseBody.access_token,
      refreshToken: responseBody.refresh_token ?? getConfig().refreshToken,
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
        if (attempt === 0) {
          continue;
        }
        return;
      } else if (
        response.status !== 204 &&
        response.headers.get("content-type")?.includes("application/json")
      ) {
        return await response.json();
      }
      return response;
    }
  }

  async function spotifyWriteRequest(
    endpoint: string,
    method: "POST" | "PUT" | "DELETE",
    body?: Record<string, unknown>
  ) {
    const token = await getOrRefreshAccessToken();
    if (!token) throw new Error("Spotify access token unavailable.");

    for (let attempt = 0; attempt < 2; attempt++) {
      const response = await fetch(`https://api.spotify.com/v1${endpoint}`, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (response.status === 429 && attempt === 0) {
        const retryAfter = response.headers.get("Retry-After");
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000
          )
        );
        continue;
      }

      if (!response.ok) {
        const message = response.headers
          .get("content-type")
          ?.includes("application/json")
          ? await response
              .json()
              .then(
                (body: { error?: { message?: string } }) => body?.error?.message
              )
              .catch(() => undefined)
          : undefined;
        throw new Error(
          message ?? `Spotify request failed. Status: ${response.status}`
        );
      }
      return;
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
    const product = (profileResponse as unknown as Record<string, unknown>)
      .product;
    if (product === undefined) return true;
    if (product === "free" || product === "open") {
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
    const fetchGenres = config.fetchGenres === true;
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
      for (let i = 0; i < artists.length; i += maxConcurrentRequests) {
        const batch = artists.slice(i, i + maxConcurrentRequests);
        const batchResults = await Promise.all(
          batch.map(
            (id) =>
              spotifyRequest(
                `/artists/${id}`
              ) as Promise<SpotifyApi.ArtistObjectFull>
          )
        );
        for (const artist of batchResults) {
          if (artist) {
            artistGenreMapping[artist.id] = artist.genres;
            artistMetadata.push({
              uri: artist.uri,
              name: artist.name,
              artworkUri: artist.images?.[0]?.url,
            });
            incrementProgress(1);
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
    const maxConcurrentRequests = 5;
    const delayMs = 200;
    const artistGenreMapping: Record<string, string[]> = {};
    for (let i = 0; i < artistIds.length; i += maxConcurrentRequests) {
      if (i > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
      const batch = artistIds.slice(i, i + maxConcurrentRequests);
      const results = await Promise.all(
        batch.map(
          (id) =>
            spotifyRequest(
              `/artists/${id}`
            ) as Promise<SpotifyApi.ArtistObjectFull>
        )
      );
      for (const artist of results) {
        if (artist) {
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

  async function loadPlaylists() {
    const config = getConfig();
    const includeOwnPlaylists = config.includeOwnPlaylists !== false;
    const includeFollowedPlaylists = config.includeFollowedPlaylists !== false;

    const likedSongsPlaylist: ExternalPlaylistInfo = {
      uri: LIKED_SONGS_PLAYLIST_ID,
      name: "Liked Songs",
      permissions: "write",
      orderable: false,
    };

    const profile = (await spotifyRequest("/me")) as
      | SpotifyApi.CurrentUsersProfileResponse
      | undefined;
    const currentUserId = profile?.id;

    const playlistsLimit = 50;
    let playlistsOffset = 0;
    let playlistsRemaining = true;
    const allPlaylists: ExternalPlaylistInfo[] = [];
    let loadedAllPlaylists = true;
    let ownPlaylistsCount = 0;
    let followedPlaylistsCount = 0;

    while (playlistsRemaining) {
      const playlistsResponse = (await spotifyRequest(
        `/me/playlists?limit=${playlistsLimit}&offset=${playlistsOffset}`
      )) as SpotifyApi.ListOfCurrentUsersPlaylistsResponse | undefined;

      if (playlistsResponse && playlistsResponse.items) {
        const playlists = playlistsResponse.items.flatMap((playlist) => {
          if (!playlist) return [];
          const isOwner =
            currentUserId != null && playlist.owner.id === currentUserId;
          if (isOwner) {
            ownPlaylistsCount++;
          } else {
            followedPlaylistsCount++;
          }
          if (isOwner && !includeOwnPlaylists) return [];
          if (!isOwner && !includeFollowedPlaylists) return [];
          const permissions: PlaylistPermissions = isOwner ? "manage" : "write";
          return [
            {
              uri: playlist.id,
              name: playlist.name,
              permissions,
              artworkUri: playlist.images?.[0]?.url,
              creatorName: playlist.owner.display_name ?? undefined,
            },
          ];
        });

        allPlaylists.push(...playlists);

        if (playlistsResponse.items.length < playlistsLimit) {
          playlistsRemaining = false;
        } else {
          playlistsOffset += playlistsLimit;
        }
      } else {
        loadedAllPlaylists = false;
        playlistsRemaining = false;
      }
    }
    if (loadedAllPlaylists) {
      host.updateData({
        ...getConfig(),
        ownPlaylistsCount,
        followedPlaylistsCount,
      });
      host.updatePlaylists([likedSongsPlaylist, ...allPlaylists]);
    }
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
      "user-modify-playback-state user-read-playback-state app-remote-control streaming user-library-read user-library-modify user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private";

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
    host.removePlaylists();
    const config = getConfig();
    host.updateData({
      accessToken: undefined,
      refreshToken: undefined,
      tokenExpiry: undefined,
      clientId: config.clientId,
      redirectUri: config.redirectUri,
    });
  }

  function waitForDeviceId(timeoutMs = 10000): Promise<string> {
    return new Promise((resolve, reject) => {
      if (deviceId) return resolve(deviceId);
      const timer = setTimeout(
        () => reject(new Error("Timed out waiting for Spotify device")),
        timeoutMs
      );
      const onReady = ({ device_id }: { device_id: string }) => {
        clearTimeout(timer);
        player?.removeListener("ready", onReady);
        resolve(device_id);
      };
      player?.addListener("ready", onReady);
    });
  }

  async function transferPlayback() {
    if (hasTransferredPlayback || !deviceId) return;
    await spotifyRequest("/me/player", "PUT", {
      device_ids: [deviceId],
    }).catch((error) => {
      console.error("Error setting device ID:", error);
    });
    hasTransferredPlayback = true;
  }

  async function sendPlayCommand(uri: TrackUri): Promise<boolean> {
    for (let attempt = 0; attempt < PLAY_ATTEMPTS; attempt++) {
      const token = await getOrRefreshAccessToken();
      if (!token) return false;
      let response: Response;
      try {
        response = await fetch(
          `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ uris: [uri] }),
          }
        );
      } catch {
        await delay(500 * (attempt + 1));
        continue;
      }
      if (response.ok) return true;
      if (response.status === 401) {
        await refreshToken();
        continue;
      }
      if (response.status === 404) {
        try {
          deviceId = await waitForDeviceId();
        } catch {
          return false;
        }
        hasTransferredPlayback = false;
        await transferPlayback();
        continue;
      }
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        await delay(retryAfter ? parseInt(retryAfter, 10) * 1000 : 1000);
        continue;
      }
      if (response.status >= 500) {
        await delay(500 * (attempt + 1));
        continue;
      }
      return false;
    }
    return false;
  }

  function playbackMatches(
    state: Spotify.PlaybackState | null,
    uri: TrackUri
  ): boolean {
    if (!state || state.loading) return false;
    const playingUri =
      state.track_window.current_track.linked_from?.uri ??
      state.track_window.current_track.uri;
    return playingUri === uri;
  }

  function confirmPlayback(uri: TrackUri): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      let settled = false;
      const finish = (confirmed: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        player?.removeListener("player_state_changed", onPlaybackStateChanged);
        resolve(confirmed);
      };
      const onPlaybackStateChanged = (event: Spotify.PlaybackState) => {
        if (playbackMatches(event, uri)) finish(true);
      };
      const timer = setTimeout(async () => {
        const state = (await player?.getCurrentState()) ?? null;
        finish(playbackMatches(state, uri));
      }, PLAY_CONFIRM_TIMEOUT);
      player?.addListener("player_state_changed", onPlaybackStateChanged);
    });
  }

  async function requestTrack(track: TrackMetadata) {
    requestingTrack = true;
    try {
      await player?.pause();
      const confirmed =
        (await sendPlayCommand(track.uri)) &&
        (await confirmPlayback(track.uri));
      if (!confirmed) {
        throw new Error(`Spotify playback not started for ${track.uri}`);
      }
    } finally {
      requestingTrack = false;
    }
  }

  function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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
        refreshPlaylists: loadPlaylists,
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
      await transferPlayback();
      if (!requestingTrack) {
        return await requestTrack(track);
      }
      return new Promise<void>((resolve, reject) => {
        if (requestTimeout) clearTimeout(requestTimeout);
        requestTimeout = setTimeout(() => {
          requestTrack(track).then(resolve, reject);
        }, 500);
      });
    },

    async getTrack(uri: TrackUri) {
      const trackId = uri.split(":").pop();
      if (!trackId) {
        throw new Error(`Invalid Spotify track URI: ${uri}`);
      }
      const trackResponse = (await spotifyRequest(`/tracks/${trackId}`)) as
        | SpotifyApi.SingleTrackResponse
        | Response
        | undefined;
      if (
        !trackResponse ||
        trackResponse instanceof Response ||
        !Array.isArray(trackResponse.artists) ||
        !trackResponse.album ||
        !Array.isArray(trackResponse.album.artists) ||
        trackResponse.restrictions?.reason
      ) {
        return undefined;
      }

      let formattedGenres: string[] | undefined;
      if (getConfig().fetchGenres === true) {
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

      if (getConfig().fetchGenres === true) {
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

    async getArtistAlbums(uri: string, startIndex: number, stopIndex: number) {
      const artistId = uri.split(":").pop();
      if (!artistId) {
        throw new Error(`Invalid Spotify artist URI: ${uri}`);
      }

      const maxLimit = 10;
      const allItems: SpotifyApi.AlbumObjectSimplified[] = [];
      for (let offset = startIndex; offset < stopIndex; offset += maxLimit) {
        const limit = Math.min(maxLimit, stopIndex - offset);
        const albumsResponse = (await spotifyRequest(
          `/artists/${artistId}/albums?include_groups=album,single&limit=${limit}&offset=${offset}`
        )) as SpotifyApi.ArtistsAlbumsResponse;
        if (!albumsResponse?.items) break;
        allItems.push(...albumsResponse.items);
        if (albumsResponse.items.length < limit) break;
      }

      return allItems.map((album) => ({
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
      const uniqueUris = Array.from(new Set(tracks));
      if (uniqueUris.length === 0) return;
      for (let i = 0; i < uniqueUris.length; i += 40) {
        const batch = uniqueUris.slice(i, i + 40).join(",");
        await spotifyRequest(
          `/me/library?uris=${encodeURIComponent(batch)}`,
          "PUT"
        );
      }
    },

    removeTracksFromRemoteLibrary: async (tracks: TrackUri[]) => {
      if (!getConfig().accessToken) return;
      const uniqueUris = Array.from(new Set(tracks));
      if (uniqueUris.length === 0) return;
      for (let i = 0; i < uniqueUris.length; i += 40) {
        const batch = uniqueUris.slice(i, i + 40).join(",");
        await spotifyRequest(
          `/me/library?uris=${encodeURIComponent(batch)}`,
          "DELETE"
        );
      }
    },

    get searchTracks() {
      if (!getConfig().accessToken) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const apiLimit = 10;
        const tracks: TrackMetadata[] = [];
        const rawTracks: SpotifyApi.TrackObjectFull[] = [];
        const artistIds = new Set<string>();

        for (let offset = startIndex; offset < stopIndex; offset += apiLimit) {
          const limit = Math.min(apiLimit, stopIndex - offset);
          const searchResponse = (await spotifyRequest(
            `/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}&offset=${offset}`
          )) as SpotifyApi.SearchResponse;

          if (!searchResponse?.tracks?.items?.length) break;

          for (const track of searchResponse.tracks.items) {
            if (track.restrictions?.reason) continue;
            tracks.push(getTrackMetadata(track, track.album, undefined));
            rawTracks.push(track);
            track.artists.forEach((artist) => artistIds.add(artist.id));
            track.album.artists.forEach((artist) => artistIds.add(artist.id));
          }

          if (searchResponse.tracks.items.length < limit) break;
        }

        if (!tracks.length) return [];

        if (getConfig().fetchGenres === true) {
          const artistGenreMapping = await fetchArtistGenres(
            Array.from(artistIds)
          );
          return tracks.map((track) => {
            const albumArtistIds =
              rawTracks
                .find((t) => t.uri === track.uri)
                ?.album.artists.map((artist) => artist.id) ?? [];
            return {
              ...track,
              genre: getUniqueGenresFromArtists(
                albumArtistIds,
                artistGenreMapping
              ),
            };
          });
        }

        return tracks;
      };
    },

    get searchAlbums() {
      if (!getConfig().accessToken) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const apiLimit = 10;
        const allItems: SpotifyApi.AlbumObjectSimplified[] = [];

        for (let offset = startIndex; offset < stopIndex; offset += apiLimit) {
          const limit = Math.min(apiLimit, stopIndex - offset);
          const searchResponse = (await spotifyRequest(
            `/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}&offset=${offset}`
          )) as SpotifyApi.SearchResponse;

          if (!searchResponse?.albums?.items?.length) break;
          allItems.push(...searchResponse.albums.items);
          if (searchResponse.albums.items.length < limit) break;
        }

        return allItems.map((album) => ({
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
        const apiLimit = 10;
        const allItems: SpotifyApi.ArtistObjectFull[] = [];

        for (let offset = startIndex; offset < stopIndex; offset += apiLimit) {
          const limit = Math.min(apiLimit, stopIndex - offset);
          const searchResponse = (await spotifyRequest(
            `/search?q=${encodeURIComponent(query)}&type=artist&limit=${limit}&offset=${offset}`
          )) as SpotifyApi.SearchResponse;

          if (!searchResponse?.artists?.items?.length) break;
          allItems.push(...searchResponse.artists.items);
          if (searchResponse.artists.items.length < limit) break;
        }

        return allItems.map((artist) => ({
          uri: artist.uri,
          name: artist.name,
          artworkUri: artist.images?.[0]?.url,
        }));
      };
    },

    get searchPlaylists() {
      if (!getConfig().accessToken) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const apiLimit = 10;
        const allItems: SpotifyApi.PlaylistObjectSimplified[] = [];

        for (let offset = startIndex; offset < stopIndex; offset += apiLimit) {
          const limit = Math.min(apiLimit, stopIndex - offset);
          const searchResponse = (await spotifyRequest(
            `/search?q=${encodeURIComponent(query)}&type=playlist&limit=${limit}&offset=${offset}`
          )) as SpotifyApi.SearchResponse;

          if (!searchResponse?.playlists?.items?.length) break;
          allItems.push(
            ...searchResponse.playlists.items.filter((p) => p != null)
          );
          if (searchResponse.playlists.items.length < limit) break;
        }

        return allItems.map((playlist) => ({
          id: playlist.id,
          name: playlist.name,
          artworkUri: playlist.images?.[0]?.url,
          creatorName: playlist.owner.display_name ?? undefined,
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

    getPlaylistTracks: async (
      id: string,
      startIndex: number,
      stopIndex: number
    ) => {
      const limit = stopIndex - startIndex;
      if (id === LIKED_SONGS_PLAYLIST_ID) {
        const likedSongsLimit = 50;
        const allUris: string[] = [];
        const allDates: (number | undefined)[] = [];
        let total = 0;
        for (
          let batchOffset = startIndex;
          batchOffset < stopIndex;
          batchOffset += likedSongsLimit
        ) {
          const batchLimit = Math.min(likedSongsLimit, stopIndex - batchOffset);
          const response = (await spotifyRequest(
            `/me/tracks?limit=${batchLimit}&offset=${batchOffset}`
          )) as SpotifyApi.UsersSavedTracksResponse;
          if (!response || !response.items)
            return { uris: [], dates: [], total: 0 };
          total = response.total;
          const items = response.items.filter((item) => item.track);
          allUris.push(...items.map((item) => item.track.uri));
          allDates.push(
            ...items.map((item) =>
              item.added_at ? new Date(item.added_at).getTime() : undefined
            )
          );
        }
        return { uris: allUris, dates: allDates, total };
      }
      const response = (await spotifyRequest(
        `/playlists/${id}/items?limit=${limit}&offset=${startIndex}&fields=total,items(added_at,item(uri))`
      )) as SpotifyApi.PlaylistTrackResponse;
      if (!response || !response.items) {
        return { uris: [], dates: [], total: 0 };
      }
      const items = response.items.filter((item) => item.item);
      const uris = items.map((item) => item.item!.uri);
      const dates = items.map((item) =>
        item.added_at ? new Date(item.added_at).getTime() : undefined
      );
      return { uris, dates, total: response.total };
    },

    renamePlaylist: async (id: string, name: string) => {
      await spotifyWriteRequest(`/playlists/${encodeURIComponent(id)}`, "PUT", {
        name,
      });
    },

    deletePlaylist: async (id: string) => {
      await spotifyWriteRequest(
        `/me/library?uris=${encodeURIComponent(`spotify:playlist:${id}`)}`,
        "DELETE"
      );
    },

    getCustomPlaylistActions: (id, permissions) => {
      const rawId = id.includes(":") ? id.split(":").slice(1).join(":") : id;
      if (permissions !== "write" || rawId === LIKED_SONGS_PLAYLIST_ID)
        return [];
      return [
        {
          label: i18n.t("spotify-player:playlists.removeFromLibrary"),
          onClick: async (playlistId: string) => {
            const rawPlaylistId = playlistId.includes(":")
              ? playlistId.split(":").slice(1).join(":")
              : playlistId;
            await spotifyWriteRequest(
              `/me/library?uris=${encodeURIComponent(`spotify:playlist:${rawPlaylistId}`)}`,
              "DELETE"
            );
            host.removePlaylists([rawPlaylistId]);
          },
        },
      ];
    },

    get addPlaylistToRemoteLibrary() {
      return !getConfig().accessToken
        ? undefined
        : async (id: string) => {
            await spotifyWriteRequest(
              `/me/library?uris=${encodeURIComponent(`spotify:playlist:${id}`)}`,
              "PUT"
            );
            await loadPlaylists();
          };
    },

    get createPlaylist() {
      return !getConfig().accessToken
        ? undefined
        : async (name: string) => {
            const response = (await spotifyRequest("/me/playlists", "POST", {
              name,
              description: "",
            })) as { id: string };
            return response.id;
          };
    },

    get refreshPlaylists() {
      return !getConfig().accessToken
        ? undefined
        : async () => {
            await loadPlaylists();
          };
    },

    addPlaylistTracks: async (id: string, uris: string[]) => {
      for (let i = 0; i < uris.length; i += 100) {
        await spotifyWriteRequest(
          `/playlists/${encodeURIComponent(id)}/items`,
          "POST",
          { uris: uris.slice(i, i + 100) }
        );
      }
    },

    removePlaylistTracks: async (id: string, uris: string[]) => {
      if (id === LIKED_SONGS_PLAYLIST_ID) {
        for (let i = 0; i < uris.length; i += 40) {
          const batch = uris.slice(i, i + 40).join(",");
          await spotifyWriteRequest(
            `/me/library?uris=${encodeURIComponent(batch)}`,
            "DELETE"
          );
        }
      } else {
        for (let i = 0; i < uris.length; i += 100) {
          await spotifyWriteRequest(
            `/playlists/${encodeURIComponent(id)}/items`,
            "DELETE",
            { tracks: uris.slice(i, i + 100).map((uri) => ({ uri })) }
          );
        }
      }
    },

    reorderPlaylistTracks: async (
      id: string,
      rangeStart: number,
      insertBefore: number,
      rangeLength: number
    ) => {
      await spotifyWriteRequest(
        `/playlists/${encodeURIComponent(id)}/items`,
        "PUT",
        {
          range_start: rangeStart,
          insert_before: insertBefore,
          range_length: rangeLength,
        }
      );
    },

    getTracksByUri: async (uris: string[]) => {
      const tracks: TrackMetadata[] = [];
      const maxConcurrentRequests = 5;
      const delayMs = 200;

      for (let i = 0; i < uris.length; i += maxConcurrentRequests) {
        if (i > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));
        const batch = uris.slice(i, i + maxConcurrentRequests);
        const results = await Promise.all(
          batch.map(
            (uri) =>
              spotifyRequest(
                `/tracks/${uri.split(":")[2]}`
              ) as Promise<SpotifyApi.SingleTrackResponse>
          )
        );
        for (const track of results) {
          if (!track || track.restrictions?.reason) continue;
          tracks.push(getTrackMetadata(track, track.album, undefined));
        }
      }

      return tracks;
    },

    dispose() {
      logout();
      const script = document.getElementById("spotify");
      script?.remove();
      i18n.removeResourceBundle("en-US", "spotify-player");
    },
  };
}
