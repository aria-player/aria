import { i18n } from "i18next";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import LibraryConfig from "./LibraryConfig";
import QuickStart from "./QuickStart";
import Attribution from "./Attribution";
import en_us from "./locales/en_us/translation.json";
import {
  ArtistMetadata,
  ExternalPlaylistInfo,
  ExternalPlaylistsCallbacks,
  ExternalPlaylistsHandle,
  PlaylistPermissions,
  SourceCallbacks,
  SourceHandle,
  Track,
  TrackMetadata,
  TrackUri,
} from "../../../../types";
import { isTauri } from "../../app/utils";

export type AppleMusicConfig = {
  loggedIn?: boolean;
  token?: string;
  tokenExpiration?: number;
  tokenEndpoint?: string;
  disableInitialSync?: boolean;
};

export default function createAppleMusicPlayer(
  host: SourceCallbacks & ExternalPlaylistsCallbacks,
  i18n: i18n
): SourceHandle & ExternalPlaylistsHandle {
  i18n.addResourceBundle("en-US", "apple-music-player", en_us);

  let music: MusicKit.MusicKitInstance | undefined;
  let isInitializing = false;
  let musicKitReadyResolve: (() => void) | undefined;
  const musicKitReady = new Promise<void>((resolve) => {
    musicKitReadyResolve = resolve;
  });

  async function waitForMusicKit(): Promise<MusicKit.MusicKitInstance> {
    if (music) return music;
    await musicKitReady;
    if (!music) {
      throw new Error("MusicKit failed to initialize");
    }
    return music;
  }

  const getConfig = () => host.getData() as AppleMusicConfig;

  let scriptElement: HTMLScriptElement | null = null;
  let scriptLoadPromise: Promise<void> | null = null;

  function loadMusicKitScript(): Promise<void> {
    if (scriptLoadPromise) return scriptLoadPromise;
    if (window.MusicKit) return Promise.resolve();
    scriptLoadPromise = new Promise<void>((resolve) => {
      document.addEventListener("musickitloaded", () => resolve(), {
        once: true,
      });
    });
    scriptElement = document.createElement("script");
    scriptElement.src =
      "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
    scriptElement.async = true;
    document.body.appendChild(scriptElement);
    return scriptLoadPromise;
  }

  function initializeWhenReady() {
    loadMusicKitScript().then(initialize);
  }

  if (getConfig().loggedIn) {
    initializeWhenReady();
  }

  async function initialize() {
    if (isInitializing || music) return;
    isInitializing = true;
    try {
      const developerToken = await getDeveloperToken();
      if (!developerToken) return;
      const musicKitConfig = {
        developerToken,
        app: {
          name: "Aria",
          build: "1.0.0",
        },
      };
      await window.MusicKit.configure(musicKitConfig);
      music = await window.MusicKit.getInstance();
      musicKitReadyResolve?.();
      if (music.isAuthorized && !getConfig().disableInitialSync) {
        fetchUserLibrary();
        loadPlaylists();
      }

      music.addEventListener("playbackStateDidChange", () => {
        if (music?.playbackState === MusicKit.PlaybackStates.ended) {
          host.finishPlayback();
        }
      });

      music.addEventListener("userTokenDidChange", () => {
        if (!music?.isAuthorized) {
          music = undefined;
          host.removePlaylists();
        }
      });
    } finally {
      isInitializing = false;
    }
  }

  function getTokenEndpoint() {
    const tokenEndpoint = getConfig().tokenEndpoint;
    return tokenEndpoint && tokenEndpoint.trim() !== ""
      ? tokenEndpoint
      : import.meta.env.VITE_APPLE_MUSIC_TOKEN_ENDPOINT;
  }

  async function getDeveloperToken(): Promise<string | undefined> {
    const config = getConfig();
    if (
      config.token &&
      config.tokenExpiration &&
      Date.now() < config.tokenExpiration
    ) {
      return config.token;
    }
    const tokenEndpoint = getTokenEndpoint();
    if (!tokenEndpoint) return;
    try {
      const response = await fetch(tokenEndpoint);
      const data = await response.json();
      host.updateData({
        ...getConfig(),
        token: data.token,
        tokenExpiration: data.expiresAt,
      });
      return data.token;
    } catch (error) {
      console.error("Failed to fetch developer token:", error);
    }
  }

  function normalizeArtworkUri(artworkUri: string | undefined) {
    return artworkUri?.replace("{w}", "1000").replace("{h}", "1000");
  }

  function getPlaylistPermissions(
    playlist: MusicKit.LibraryPlaylists
  ): PlaylistPermissions {
    return playlist.attributes?.canEdit ? "write" : "read";
  }

  function getPlaylistTrackUri(track: MusicKit.Songs | MusicKit.MusicVideos) {
    return (
      track.attributes?.playParams?.catalogId ??
      track.attributes?.playParams?.id ??
      track.id
    );
  }

  function getPlaylistTrackType(uri: TrackUri) {
    return uri.startsWith("i.") || uri.startsWith("l.")
      ? "library-songs"
      : "songs";
  }

  function getPlaylistArtworkUri(playlist: MusicKit.LibraryPlaylists) {
    return normalizeArtworkUri(
      playlist.attributes?.artwork?.url ??
        playlist.relationships?.catalog?.data[0]?.attributes?.artwork?.url
    );
  }

  function isLibraryPlaylistId(id: string) {
    return id.startsWith("p.");
  }

  async function getWriteTokens() {
    const musicKit = await waitForMusicKit();
    const developerToken = await getDeveloperToken();
    if (!developerToken || !musicKit.musicUserToken) {
      throw new Error("Apple Music authorization unavailable.");
    }
    return { developerToken, musicUserToken: musicKit.musicUserToken };
  }

  async function appleMusicPost(path: string, body?: object) {
    const { developerToken, musicUserToken } = await getWriteTokens();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${developerToken}`,
      "Music-User-Token": musicUserToken,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }
    const response = await fetch(`https://api.music.apple.com/${path}`, {
      method: "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (!response.ok) {
      const responseBody = response.headers
        .get("content-type")
        ?.includes("application/json")
        ? ((await response.json().catch(() => undefined)) as
            | { errors?: Array<{ title?: string; detail?: string }> }
            | undefined)
        : undefined;
      const firstError = responseBody?.errors?.[0];
      const message =
        firstError?.detail ??
        firstError?.title ??
        `Apple Music request failed. Status: ${response.status}`;
      throw new Error(message);
    }
    return response;
  }

  async function loadPlaylists() {
    if (!music?.isAuthorized) return;
    const musicKit = await waitForMusicKit();
    const playlists: ExternalPlaylistInfo[] = [];
    const limit = 100;
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const response = (await musicKit.api.music(
        `v1/me/library/playlists?limit=${limit}&offset=${offset}&include=catalog`
      )) as { data: MusicKit.Relationship<MusicKit.LibraryPlaylists> };
      const batch = response.data?.data ?? [];
      playlists.push(
        ...batch.map((playlist) => ({
          uri: playlist.id,
          name: playlist.attributes?.name ?? "",
          permissions: getPlaylistPermissions(playlist),
          orderable: false,
          artworkUri: getPlaylistArtworkUri(playlist),
        }))
      );
      if (!response.data?.next || batch.length === 0) {
        hasMore = false;
      } else {
        offset += limit;
      }
    }
    host.updatePlaylists(playlists);
  }

  async function fetchPlaylistUris(
    playlistId: string,
    startIndex: number,
    stopIndex: number
  ): Promise<{ uris: string[]; total: number }> {
    const musicKit = await waitForMusicKit();
    const limit = Math.max(0, stopIndex - startIndex);
    if (limit === 0) return { uris: [], total: 0 };
    const basePath = isLibraryPlaylistId(playlistId)
      ? `v1/me/library/playlists/${playlistId}/tracks`
      : `v1/catalog/${musicKit.storefrontId}/playlists/${playlistId}/tracks`;
    try {
      const response = (await musicKit.api.music(
        `${basePath}?limit=${limit}&offset=${startIndex}`
      )) as {
        data: MusicKit.Relationship<MusicKit.Songs | MusicKit.MusicVideos>;
      };
      const tracks = response.data?.data ?? [];
      const total = response.data?.meta?.total ?? tracks.length;
      const uris = tracks
        .filter((track) => !(track.type as string).includes("music-video"))
        .map((track) => getPlaylistTrackUri(track))
        .filter((uri): uri is string => uri != null && uri !== "");
      return { uris, total };
    } catch {
      return { uris: [], total: 0 };
    }
  }

  async function fetchUserLibrary() {
    const existingTracks = host.getTracks();
    const existingArtists = host.getArtists();
    const tracksInLibrary: string[] = [];
    const artistsInLibrary: string[] = [];
    let progress = 0;

    const totalTracksResponse = (await music?.api.music(
      "v1/me/library/songs?limit=1&sort=-dateAdded&include=albums"
    )) as { data: MusicKit.Relationship<MusicKit.Songs> };
    const totalTracks = totalTracksResponse.data.meta?.total || 0;

    host.setSyncProgress({
      synced: 0,
      total: totalTracks,
    });

    const allTracks: TrackMetadata[] = [];
    const tracksLimit = 100;
    const maxConcurrentRequests = 10;
    for (
      let offset = 0;
      offset < totalTracks;
      offset += tracksLimit * maxConcurrentRequests
    ) {
      const remainingTracks = totalTracks - offset;
      const requestsInBatch = Math.min(
        maxConcurrentRequests,
        Math.ceil(remainingTracks / tracksLimit)
      );
      const promises = [];
      for (let i = 0; i < requestsInBatch; i++) {
        const currentOffset = offset + i * tracksLimit;
        const url = `v1/me/library/songs?limit=${tracksLimit}&offset=${currentOffset}&sort=-dateAdded&include=albums`;
        promises.push(fetchTracks(url));
      }

      try {
        const batchResults = await Promise.all(promises);
        for (const result of batchResults) {
          if (result) {
            allTracks.push(...result.tracks);
            tracksInLibrary.push(...result.tracks.map((track) => track.uri));
            artistsInLibrary.push(...result.artists);
            progress += result.tracks.length;

            host.setSyncProgress({
              synced: progress,
              total: totalTracks,
            });
          }
        }

        if (!music?.isAuthorized) return;

        if (allTracks.length > 0) {
          host.updateLibraryTracks([...allTracks]);
        }
      } catch (error) {
        console.error("Error fetching user library:", error);
      }
    }
    const removedTracks = existingTracks.filter(
      (track) => !tracksInLibrary.includes(track.uri)
    );
    if (removedTracks.length > 0) {
      host.removeLibraryTracks(removedTracks.map((track) => track.uri));
    }

    if (!music?.isAuthorized) return;
    const removedArtists = existingArtists
      .filter((artist) => !artistsInLibrary.includes(artist.uri))
      .map((artist) => artist.uri);
    if (removedArtists.length > 0) {
      host.removeArtists(removedArtists);
    }
  }

  async function fetchTracks(
    url: string
  ): Promise<{ tracks: TrackMetadata[]; artists: string[] } | null> {
    try {
      const tracksResponse = await music?.api.music(url);
      const { data } = (
        tracksResponse as { data: MusicKit.Relationship<MusicKit.Songs> }
      ).data;
      const tracks: TrackMetadata[] = [];
      const libraryToCatalogMap: Record<string, string> = {};
      data.forEach((track) => {
        const albumData = track.relationships?.albums
          .data[0] as unknown as MusicKit.LibraryAlbums;
        /* We only want to fetch catalog IDs for songs from Apple Music, and songs from
        the user's iCloud Music library don't seem to have the releaseDate attribute,
        so that is being used to identify them here. */
        if (
          albumData.attributes?.releaseDate &&
          track.attributes?.playParams?.catalogId
        ) {
          libraryToCatalogMap[track.id] = track.attributes.playParams.catalogId;
        }
        tracks.push(
          getTrackMetadata(
            track,
            albumData,
            (albumData.attributes?.dateAdded &&
              new Date(albumData.attributes.dateAdded).getTime()) ||
              undefined
          )
        );
      });

      await addCatalogArtistsToTracks(tracks, libraryToCatalogMap);

      const artistData = await fetchCatalogArtists(
        Object.values(libraryToCatalogMap)
      );
      return { tracks, artists: Object.keys(artistData) };
    } catch (error) {
      console.error("Error fetching tracks:", error);
      return null;
    }
  }

  function getTrackMetadata(
    track: MusicKit.Songs,
    albumData: {
      id: string;
      attributes?:
        | MusicKit.Albums["attributes"]
        | MusicKit.LibraryAlbums["attributes"];
    },
    dateAdded: number | undefined
  ): TrackMetadata {
    return {
      uri: track.id,
      title: track.attributes?.name ?? "",
      artist: track.attributes?.artistName,
      albumArtist:
        albumData.attributes?.artistName ?? track.attributes?.artistName,
      album: track.attributes?.albumName,
      albumUri: albumData.id,
      genre: track.attributes?.genreNames,
      duration: track.attributes?.durationInMillis,
      artworkUri: track.attributes?.artwork?.url,
      disc: track.attributes?.discNumber,
      track: track.attributes?.trackNumber,
      ...(dateAdded !== undefined && { dateAdded }),
      year:
        albumData.attributes?.releaseDate &&
        parseInt(albumData.attributes.releaseDate.split("-")[0]),
      dateReleased:
        albumData.attributes?.releaseDate &&
        new Date(albumData.attributes.releaseDate).getTime(),
      metadataLoaded: true,
    } as TrackMetadata;
  }

  async function addCatalogArtistsToTracks(
    tracks: TrackMetadata[],
    catalogIdMap: Record<string, string>
  ): Promise<void> {
    const catalogIds = Object.values(catalogIdMap);
    if (catalogIds.length === 0) return;

    const artistData = await fetchCatalogArtists(catalogIds);

    tracks.forEach((track) => {
      const catalogId = catalogIdMap[track.uri];
      const data = catalogId ? artistData[catalogId] : undefined;

      if (data) {
        track.uri = catalogId;
      }
      if (data?.artist?.length) {
        track.artist = data.artist;
        track.artistUri = data.artistUri;
      }
      if (data?.albumArtist?.length) {
        track.albumArtist = data.albumArtist;
        track.albumArtistUri = data.albumArtistUri;
      }
      if (data?.albumUri) {
        track.albumUri = data.albumUri;
      }
    });
  }

  /* Apple Music doesn't seem to include artist arrays in library responses, so
  we need to fetch them separately in case songs have multiple artists. */
  async function fetchCatalogArtists(
    catalogIds: string[]
  ): Promise<Record<string, Partial<TrackMetadata>>> {
    const songBatches = await batchFetch<MusicKit.Songs>(
      catalogIds,
      300,
      `v1/catalog/${music?.storefrontId}/songs`
    );

    const songToArtistIds: Record<string, string[]> = {};
    const albumIds: string[] = [];
    songBatches.forEach((song) => {
      songToArtistIds[song.id] =
        song.relationships?.artists?.data.map((artist) => artist.id) ?? [];
      const albumId = song.relationships?.albums?.data?.[0]?.id;
      if (albumId && !albumIds.includes(albumId)) albumIds.push(albumId);
    });

    const albumBatches = await batchFetch<MusicKit.Albums>(
      albumIds,
      100,
      `v1/catalog/${music?.storefrontId}/albums`
    );
    const albumToArtistIds: Record<string, string[]> = {};
    albumBatches.forEach((album) => {
      albumToArtistIds[album.id] =
        album.relationships?.artists?.data.map((artist) => artist.id) ?? [];
    });

    const allArtistIds = new Set([
      ...Object.values(songToArtistIds).flat(),
      ...Object.values(albumToArtistIds).flat(),
    ]);

    /* The artists included in the songs/albums responses don't include the artist names,
    so they are fetched based on the artist IDs here. */
    const artistBatches = await batchFetch<MusicKit.Artists>(
      Array.from(allArtistIds),
      25,
      `v1/catalog/${music?.storefrontId}/artists`
    );
    const artistMap: Record<string, string> = {};
    const artistsToUpdate: ArtistMetadata[] = [];
    artistBatches.forEach((artist) => {
      if (artist.attributes?.name) {
        artistMap[artist.id] = artist.attributes.name;
        artistsToUpdate.push({
          uri: artist.id,
          name: artist.attributes.name,
          artworkUri: (
            artist.attributes as MusicKit.Artists["attributes"] & {
              artwork?: MusicKit.Artwork;
            }
          ).artwork?.url,
        });
      }
    });
    if (artistsToUpdate.length > 0) {
      host.updateArtists(artistsToUpdate);
    }

    const result: Record<string, Partial<TrackMetadata>> = {};
    songBatches.forEach((song) => {
      const artistUri = songToArtistIds[song.id];
      const albumId = song.relationships?.albums?.data?.[0]?.id;
      const albumArtistUri = albumId ? (albumToArtistIds[albumId] ?? []) : [];

      result[song.id] = {
        artist: artistUri.map((id) => artistMap[id]).filter(Boolean),
        artistUri,
        albumArtist: albumArtistUri.map((id) => artistMap[id]).filter(Boolean),
        albumArtistUri,
        albumUri: albumId,
      };
    });

    return result;
  }

  async function batchFetch<T>(
    ids: string[],
    batchSize: number,
    endpoint: string
  ): Promise<T[]> {
    const maxConcurrentRequests = 5;
    const separator = endpoint.includes("?") ? "&" : "?";
    const urls: string[] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize).join(",");
      urls.push(`${endpoint}${separator}ids=${batch}`);
    }

    const results: { data: MusicKit.Relationship<T> }[] = [];
    for (let i = 0; i < urls.length; i += maxConcurrentRequests) {
      const batch = urls.slice(i, i + maxConcurrentRequests);
      const promises = batch.map((url) => music?.api.music(url));
      try {
        const responses = await Promise.all(promises);
        results.push(
          ...(responses.filter(Boolean) as { data: MusicKit.Relationship<T> }[])
        );
      } catch (error) {
        console.error("Error in batch fetch:", error);
      }
    }

    return results.flatMap((response) => response.data?.data ?? []);
  }

  async function authenticate() {
    await loadMusicKitScript();
    if (!getTokenEndpoint()) {
      host.showAlert({
        heading: i18n.t(
          "apple-music-player:errorDialog.tokenEndpointRequiredHeading"
        ),
        message: i18n.t(
          "apple-music-player:errorDialog.tokenEndpointRequiredMessage"
        ),
        closeLabel: i18n.t("apple-music-player:errorDialog.close"),
      });
      return;
    }
    if (!(await getDeveloperToken())) {
      host.showAlert({
        heading: i18n.t(
          "apple-music-player:errorDialog.tokenFetchErrorHeading"
        ),
        message: i18n.t(
          "apple-music-player:errorDialog.tokenFetchErrorMessage"
        ),
        closeLabel: i18n.t("apple-music-player:errorDialog.close"),
      });
      return;
    }
    await initialize();
    if (!music) {
      host.showAlert({
        heading: i18n.t("apple-music-player:errorDialog.musicKitErrorHeading"),
        message: i18n.t("apple-music-player:errorDialog.musicKitErrorMessage"),
        closeLabel: i18n.t("apple-music-player:errorDialog.close"),
      });
      return;
    }
    const defaultWindowOpen = window.open.bind(window);

    let closeAuthWindow: (() => void) | undefined;
    let unlistenAuthWindowClosed: (() => void) | undefined;
    let unlistenAuthWindowMessages: (() => void) | undefined;

    try {
      if (isTauri()) {
        let authWindowHref: string | null = null;

        unlistenAuthWindowClosed = await listen<void>(
          "auth_window_closed",
          () => {
            authWindowHref = null;
          }
        );

        unlistenAuthWindowMessages = await listen<{
          data?: string;
          origin?: string;
        }>("auth_window_message", (event) => {
          const payload = event.payload ?? {};
          let parsedData = payload.data;
          if (typeof parsedData === "string") {
            try {
              parsedData = JSON.parse(parsedData);
            } catch {
              parsedData = payload.data;
            }
          }
          window.dispatchEvent(
            new MessageEvent("message", {
              data: parsedData,
              origin: payload.origin || window.location.origin,
            })
          );
        });

        const createAuthWindow = (nextUrl: string) => {
          authWindowHref = nextUrl;
          invoke("open_auth_window", {
            url: nextUrl,
            mainWindowOrigin: window.location.origin,
          });
        };

        closeAuthWindow = () => {
          authWindowHref = null;
          invoke("close_auth_window");
        };

        window.open = ((url?: string, target?: string, features?: string) => {
          if (url?.includes("music.apple.com")) {
            createAuthWindow(url);
            const authWindowProxy = {
              get closed() {
                return authWindowHref === null;
              },
              close: () => {
                closeAuthWindow?.();
              },
              focus: () => undefined,
              postMessage: (data: unknown, origin?: string) => {
                invoke("post_message_to_auth_window", {
                  data: typeof data === "string" ? data : JSON.stringify(data),
                  origin: origin || window.location.origin,
                });
              },
            };

            return authWindowProxy;
          }

          return defaultWindowOpen(url, target, features);
        }) as typeof window.open;
      }
      await music?.authorize();
    } finally {
      window.open = defaultWindowOpen;
      Promise.resolve(unlistenAuthWindowClosed?.()).catch(() => {});
      Promise.resolve(unlistenAuthWindowMessages?.()).catch(() => {});
      closeAuthWindow?.();
    }
    if (!music?.isAuthorized) return;
    host.updateData({ ...getConfig(), loggedIn: true });
    await fetchUserLibrary();
    await loadPlaylists();
  }

  async function logout() {
    await music?.unauthorize();
    host.updateData({ ...getConfig(), loggedIn: false });
    host.setSyncProgress({ synced: 0, total: 0 });
    host.removeTracks();
    host.removeArtists();
    host.removePlaylists();
  }

  return {
    displayName: "Apple Music",

    disableAutomaticTrackSkip: true,

    LibraryConfig: (props) =>
      LibraryConfig({ ...props, host, authenticate, logout, i18n }),

    QuickStart: (props) => QuickStart({ ...props, authenticate, i18n }),

    Attribution: (props) =>
      Attribution({
        ...props,
        i18n,
        storefrontId: music?.storefrontId,
      }),

    loadAndPlayTrack: async (track: Track) => {
      if (music) {
        (music as unknown as MusicKit.Player).volume = host.getMuted()
          ? 0
          : host.getVolume() / 100;
      }
      await music?.setQueue({ song: track.uri });
      await music?.play();
    },

    getTrack: async (uri: TrackUri) => {
      const music = await waitForMusicKit();
      try {
        if (uri.startsWith("l.")) {
          return undefined;
        }
        const trackResponse = (await music.api.music(
          `v1/catalog/${music.storefrontId}/songs/${uri}`
        )) as {
          data: MusicKit.Relationship<MusicKit.Songs>;
        };
        const trackData = trackResponse.data?.data?.[0];
        if (!trackData) {
          return undefined;
        }
        const albumData = trackData.relationships?.albums
          ?.data[0] as unknown as MusicKit.Albums;
        if (!albumData) {
          return undefined;
        }
        const track = getTrackMetadata(
          trackData,
          albumData ?? { id: "", attributes: undefined },
          undefined
        );
        const catalogIdMap: Record<string, string> = {};
        catalogIdMap[trackData.id] = trackData.id;
        await addCatalogArtistsToTracks([track], catalogIdMap);
        return track;
      } catch (error) {
        console.error("Failed to fetch track:", error);
        return undefined;
      }
    },

    getTrackArtwork: async (artworkUri) => {
      return normalizeArtworkUri(artworkUri);
    },

    getArtistArtwork: async (artworkUri) => {
      return normalizeArtworkUri(artworkUri);
    },

    getAlbumTracks: async (uri: string) => {
      const music = await waitForMusicKit();
      if (uri.startsWith("l.")) {
        // Library albums should already be fully loaded
        return [];
      }
      try {
        const albumResponse = (await music.api.music(
          `v1/catalog/${music.storefrontId}/albums/${uri}`
        )) as {
          data: MusicKit.Relationship<MusicKit.Albums>;
        };

        const albumData = albumResponse.data?.data?.[0];
        if (!albumData) {
          throw new Error(`Album not found: ${uri}`);
        }

        const tracks: TrackMetadata[] = [];
        const catalogIdMap: Record<string, string> = {};
        const albumAttributes =
          albumData.attributes as MusicKit.Albums["attributes"];

        let tracksOffset = 0;
        const tracksLimit = 300;
        let hasMore = true;

        while (hasMore) {
          const tracksResponse = (await music.api.music(
            `v1/catalog/${music.storefrontId}/albums/${uri}/tracks?limit=${tracksLimit}&offset=${tracksOffset}`
          )) as {
            data: MusicKit.Relationship<MusicKit.Songs>;
          };

          const albumTracks = tracksResponse.data?.data;
          if (!albumTracks || albumTracks.length === 0) {
            hasMore = false;
            break;
          }

          albumTracks.forEach((track) => {
            catalogIdMap[track.id] = track.id;
            tracks.push(
              getTrackMetadata(
                track,
                { id: albumData.id, attributes: albumAttributes },
                undefined
              )
            );
          });

          hasMore = albumTracks.length === tracksLimit;
          tracksOffset += tracksLimit;
        }

        if (tracks.length === 0) {
          throw new Error(`No tracks found for album: ${uri}`);
        }

        await addCatalogArtistsToTracks(tracks, catalogIdMap);

        return tracks;
      } catch (error) {
        console.error("Failed to fetch album tracks:", error);
        throw error;
      }
    },

    getArtistInfo: async (uri: string) => {
      const music = await waitForMusicKit();
      try {
        const artistResponse = (await music.api.music(
          `v1/catalog/${music.storefrontId}/artists/${uri}`
        )) as {
          data: MusicKit.Relationship<MusicKit.Artists>;
        };

        const artistData = artistResponse.data?.data?.[0];
        if (!artistData) {
          return undefined;
        }

        return {
          uri: artistData.id,
          name: artistData.attributes?.name ?? "",
          artworkUri: undefined,
        };
      } catch (error) {
        console.error("Failed to fetch artist info:", error);
        return undefined;
      }
    },

    getArtistTopTracks: async (
      uri: string,
      startIndex: number,
      stopIndex: number
    ) => {
      const music = await waitForMusicKit();
      if (uri.startsWith("l.")) {
        return [];
      }
      try {
        const limit = stopIndex - startIndex;
        const tracksResponse = (await music.api.music(
          `v1/catalog/${music.storefrontId}/artists/${uri}/songs?limit=${limit}&offset=${startIndex}&include=albums`
        )) as {
          data: MusicKit.Relationship<MusicKit.Songs>;
        };
        const songs = tracksResponse.data?.data;
        if (!songs || songs.length === 0) {
          return [];
        }

        const tracks: TrackMetadata[] = [];
        const catalogIdMap: Record<string, string> = {};
        songs.forEach((track) => {
          catalogIdMap[track.id] = track.id;
          const albumData = track.relationships?.albums
            .data[0] as unknown as MusicKit.Albums;
          tracks.push(getTrackMetadata(track, albumData, undefined));
        });
        await addCatalogArtistsToTracks(tracks, catalogIdMap);
        return tracks;
      } catch (error) {
        console.error("Failed to fetch artist tracks:", error);
        return [];
      }
    },

    getArtistAlbums: async (
      uri: string,
      startIndex: number,
      stopIndex: number
    ) => {
      const music = await waitForMusicKit();
      if (uri.startsWith("l.")) {
        return [];
      }
      try {
        const limit = stopIndex - startIndex;
        const albumsResponse = (await music.api.music(
          `v1/catalog/${music.storefrontId}/artists/${uri}/albums?limit=${limit}&offset=${startIndex}&include=artists&sort=-releaseDate`
        )) as {
          data: MusicKit.Relationship<MusicKit.Albums>;
        };
        const albums = albumsResponse.data?.data;
        if (!albums || albums.length === 0) {
          return [];
        }

        const allArtistIds = new Set<string>();
        albums.forEach((album) => {
          album.relationships?.artists?.data?.forEach((artist) => {
            allArtistIds.add(artist.id);
          });
        });

        const artistMap: Record<string, string> = {};
        if (allArtistIds.size > 0) {
          const artistBatches = await batchFetch<MusicKit.Artists>(
            Array.from(allArtistIds),
            25,
            `v1/catalog/${music.storefrontId}/artists`
          );
          artistBatches.forEach((artist) => {
            if (artist.attributes?.name) {
              artistMap[artist.id] = artist.attributes.name;
            }
          });
        }

        return albums.map((album) => {
          const artistUris =
            album.relationships?.artists?.data?.map((a) => a.id) ?? [];
          const artistNames = artistUris
            .map((id) => artistMap[id])
            .filter(Boolean);

          return {
            uri: album.id,
            name: album.attributes?.name ?? "",
            artist:
              artistNames.length > 0
                ? artistNames
                : (album.attributes?.artistName ?? ""),
            artistUri: artistUris.length > 0 ? artistUris : uri,
            year: album.attributes?.releaseDate
              ? parseInt(album.attributes.releaseDate.split("-")[0])
              : undefined,
            dateReleased: album.attributes?.releaseDate
              ? new Date(album.attributes.releaseDate).getTime()
              : undefined,
            artworkUri: album.attributes?.artwork?.url,
          };
        });
      } catch (error) {
        console.error("Failed to fetch artist albums:", error);
        return [];
      }
    },

    get searchTracks() {
      if (!getConfig().loggedIn) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const music = await waitForMusicKit();
        try {
          const limit = stopIndex - startIndex;
          const searchResponse = (await music.api.music(
            `v1/catalog/${music.storefrontId}/search?term=${encodeURIComponent(query)}&types=songs&limit=${limit}&offset=${startIndex}&include=albums`
          )) as {
            data: {
              results: {
                songs?: MusicKit.Relationship<MusicKit.Songs>;
              };
            };
          };

          const songs = searchResponse.data?.results?.songs?.data;
          if (!songs || songs.length === 0) {
            return [];
          }

          const tracks: TrackMetadata[] = [];
          const catalogIdMap: Record<string, string> = {};
          songs.forEach((track) => {
            catalogIdMap[track.id] = track.id;
            const albumData = track.relationships?.albums
              ?.data[0] as unknown as MusicKit.Albums;
            tracks.push(
              getTrackMetadata(
                track,
                albumData ?? { id: "", attributes: undefined },
                undefined
              )
            );
          });
          await addCatalogArtistsToTracks(tracks, catalogIdMap);
          return tracks;
        } catch (error) {
          console.error("Failed to fetch tracks:", error);
          return [];
        }
      };
    },

    get searchAlbums() {
      if (!getConfig().loggedIn) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const music = await waitForMusicKit();
        try {
          const limit = stopIndex - startIndex;
          const searchResponse = (await music.api.music(
            `v1/catalog/${music.storefrontId}/search?term=${encodeURIComponent(query)}&types=albums&limit=${limit}&offset=${startIndex}`
          )) as {
            data: {
              results: {
                albums?: MusicKit.Relationship<MusicKit.Albums>;
              };
            };
          };

          const albums = searchResponse.data?.results?.albums?.data;
          if (!albums || albums.length === 0) {
            return [];
          }
          const albumIds = albums.map((album) => album.id);
          const albumDetails = await batchFetch<MusicKit.Albums>(
            albumIds,
            25,
            `v1/catalog/${music.storefrontId}/albums`
          );
          const albumToArtistIds: Record<string, string[]> = {};
          const allArtistIds = new Set<string>();

          albumDetails.forEach((album) => {
            const artistIds =
              album.relationships?.artists?.data?.map((a) => a.id) ?? [];
            if (artistIds.length > 0) {
              albumToArtistIds[album.id] = artistIds;
              artistIds.forEach((id) => allArtistIds.add(id));
            }
          });
          const artistMap: Record<string, string> = {};
          if (allArtistIds.size > 0) {
            const artistBatches = await batchFetch<MusicKit.Artists>(
              Array.from(allArtistIds),
              25,
              `v1/catalog/${music.storefrontId}/artists`
            );
            artistBatches.forEach((artist) => {
              if (artist.attributes?.name) {
                artistMap[artist.id] = artist.attributes.name;
              }
            });
          }

          return albums.map((album) => {
            const artistUris = albumToArtistIds[album.id] ?? [];
            const artistNames = artistUris
              .map((id) => artistMap[id])
              .filter(Boolean);

            return {
              uri: album.id,
              name: album.attributes?.name ?? "",
              artist:
                artistNames.length > 0
                  ? artistNames
                  : (album.attributes?.artistName ?? ""),
              artistUri: artistUris,
              year: album.attributes?.releaseDate
                ? parseInt(album.attributes.releaseDate.split("-")[0])
                : undefined,
              dateReleased: album.attributes?.releaseDate
                ? new Date(album.attributes.releaseDate).getTime()
                : undefined,
              artworkUri: album.attributes?.artwork?.url,
            };
          });
        } catch (error) {
          console.error("Failed to search albums:", error);
          return [];
        }
      };
    },

    get searchArtists() {
      if (!getConfig().loggedIn) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const music = await waitForMusicKit();
        try {
          const limit = stopIndex - startIndex;
          const searchResponse = (await music.api.music(
            `v1/catalog/${music.storefrontId}/search?term=${encodeURIComponent(query)}&types=artists&limit=${limit}&offset=${startIndex}`
          )) as {
            data: {
              results: {
                artists?: MusicKit.Relationship<MusicKit.Artists>;
              };
            };
          };

          const artists = searchResponse.data?.results?.artists?.data;
          if (!artists || artists.length === 0) {
            return [];
          }

          return artists.map((artist) => ({
            uri: artist.id,
            name: artist.attributes?.name ?? "",
            artworkUri: (
              artist.attributes as MusicKit.Artists["attributes"] & {
                artwork?: MusicKit.Artwork;
              }
            ).artwork?.url,
          }));
        } catch (error) {
          console.error("Failed to search artists:", error);
          return [];
        }
      };
    },

    get searchPlaylists() {
      if (!getConfig().loggedIn) return undefined;
      return async (query: string, startIndex: number, stopIndex: number) => {
        const music = await waitForMusicKit();
        try {
          const limit = stopIndex - startIndex;
          const searchResponse = (await music.api.music(
            `v1/catalog/${music.storefrontId}/search?term=${encodeURIComponent(query)}&types=playlists&limit=${limit}&offset=${startIndex}`
          )) as {
            data: {
              results: {
                playlists?: MusicKit.Relationship<MusicKit.Playlists>;
              };
            };
          };
          const playlists = searchResponse.data?.results?.playlists?.data;
          if (!playlists || playlists.length === 0) {
            return [];
          }
          return playlists.map((playlist) => ({
            id: playlist.id,
            name: playlist.attributes?.name ?? "",
            artworkUri: normalizeArtworkUri(playlist.attributes?.artwork?.url),
            creatorName: playlist.attributes?.curatorName,
          }));
        } catch (error) {
          console.error("Failed to search playlists:", error);
          return [];
        }
      };
    },

    getPlaylistTracks: async (
      id: string,
      startIndex: number,
      stopIndex: number
    ) => {
      return fetchPlaylistUris(id, startIndex, stopIndex);
    },

    createPlaylist: async (name: string) => {
      const response = await appleMusicPost("v1/me/library/playlists", {
        attributes: { name },
      });
      const responseData = (await response.json()) as {
        data?: Array<{ id?: string }>;
      };
      const playlistId = responseData.data?.[0]?.id;
      if (!playlistId) {
        throw new Error("Apple Music playlist creation returned no ID.");
      }
      await loadPlaylists();
      return playlistId;
    },

    refreshPlaylists: async () => {
      await loadPlaylists();
    },

    addPlaylistTracks: async (id: string, uris: string[]) => {
      if (!isLibraryPlaylistId(id) || uris.length === 0) return;
      const batchSize = 100;
      for (let index = 0; index < uris.length; index += batchSize) {
        const batchUris = uris.slice(index, index + batchSize);
        await appleMusicPost(`v1/me/library/playlists/${id}/tracks`, {
          data: batchUris.map((uri) => ({
            id: uri,
            type: getPlaylistTrackType(uri),
          })),
        });
      }
    },

    addTracksToRemoteLibrary: async (tracks: TrackUri[]) => {
      const music = await waitForMusicKit();
      if (!music.isAuthorized) return;
      const catalogIds = Array.from(
        new Set(
          tracks.filter(
            (uri) =>
              uri &&
              !uri.startsWith("l.") &&
              !uri.startsWith("i.") &&
              !uri.startsWith("p.") &&
              !uri.startsWith("pl.")
          )
        )
      );
      if (catalogIds.length === 0) return;
      const batchSize = 200;
      for (let i = 0; i < catalogIds.length; i += batchSize) {
        const batch = catalogIds.slice(i, i + batchSize).join(",");
        await appleMusicPost(`v1/me/library?ids[songs]=${batch}`);
      }
    },

    getTracksByUri: async (uris: string[]) => {
      const music = await waitForMusicKit();
      const uniqueUris = Array.from(new Set(uris.filter(Boolean)));
      if (uniqueUris.length === 0) return [];

      const localTracks: TrackMetadata[] = [];
      const missingUris: string[] = [];
      for (const uri of uniqueUris) {
        const existing = host.getTrackByUri(uri);
        if (existing) {
          localTracks.push(existing);
        } else {
          missingUris.push(uri);
        }
      }
      if (missingUris.length === 0) return localTracks;

      const catalogUris = missingUris.filter(
        (uri) => !uri.startsWith("i.") && !uri.startsWith("l.")
      );
      const libraryUris = missingUris.filter(
        (uri) => uri.startsWith("i.") || uri.startsWith("l.")
      );

      const tracks: TrackMetadata[] = [];
      const catalogIdMap: Record<string, string> = {};

      if (catalogUris.length > 0) {
        const catalogTracks = await batchFetch<MusicKit.Songs>(
          catalogUris,
          300,
          `v1/catalog/${music.storefrontId}/songs?include=albums`
        );
        catalogTracks.forEach((track) => {
          const albumData = track.relationships?.albums
            ?.data[0] as unknown as MusicKit.Albums;
          if (!albumData) return;
          catalogIdMap[track.id] = track.id;
          tracks.push(getTrackMetadata(track, albumData, undefined));
        });
      }

      if (libraryUris.length > 0) {
        const batchSize = 25;
        for (let index = 0; index < libraryUris.length; index += batchSize) {
          const batch = libraryUris.slice(index, index + batchSize);
          const responses = await Promise.all(
            batch.map((uri) =>
              music.api.music(`v1/me/library/songs/${uri}?include=albums`)
            )
          );
          for (const response of responses) {
            const track = (
              response as { data: MusicKit.Relationship<MusicKit.Songs> }
            ).data?.data?.[0];
            if (!track) continue;
            const albumData = track.relationships?.albums
              ?.data[0] as unknown as MusicKit.LibraryAlbums;
            if (!albumData) continue;
            if (
              albumData.attributes?.releaseDate &&
              track.attributes?.playParams?.catalogId
            ) {
              catalogIdMap[track.id] = track.attributes.playParams.catalogId;
            }
            tracks.push(
              getTrackMetadata(
                track,
                albumData,
                (albumData.attributes?.dateAdded &&
                  new Date(albumData.attributes.dateAdded).getTime()) ||
                  undefined
              )
            );
          }
        }
      }

      await addCatalogArtistsToTracks(tracks, catalogIdMap);
      return [...localTracks, ...tracks];
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
      const hasEnded = music?.playbackState === MusicKit.PlaybackStates.ended;
      music?.seekToTime(position / 1000).then(() => {
        if (hasEnded) music?.play();
      });
    },

    onDataUpdate: (data) => {
      if (!music && (data as AppleMusicConfig).tokenEndpoint) {
        initializeWhenReady();
      }
    },

    dispose: () => {
      music?.stop();
      if (scriptElement?.parentNode) {
        scriptElement.parentNode.removeChild(scriptElement);
      }
      document.removeEventListener("musickitloaded", initialize);
      i18n.removeResourceBundle("en-US", "apple-music-player");
    },
  };
}
