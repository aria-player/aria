import { i18n } from "i18next";
import LibraryConfig from "./LibraryConfig";
import QuickStart from "./QuickStart";
import en_us from "./locales/en_us/translation.json";
import {
  ArtistMetadata,
  SourceCallbacks,
  SourceHandle,
  Track,
  TrackMetadata
} from "../../../../types";

export type AppleMusicConfig = {
  loggedIn?: boolean;
  token?: string;
  tokenExpiration?: number;
  tokenEndpoint?: string;
};

export default function createAppleMusicPlayer(
  host: SourceCallbacks,
  i18n: i18n
): SourceHandle {
  i18n.addResourceBundle("en-US", "apple-music-player", en_us);

  let music: MusicKit.MusicKitInstance | undefined;
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

  const script = document.createElement("script");
  script.src = "https://js-cdn.music.apple.com/musickit/v3/musickit.js";
  script.async = true;
  document.body.appendChild(script);

  if (getConfig().loggedIn) {
    document.addEventListener("musickitloaded", initialize);
  }

  async function initialize() {
    const developerToken = await getDeveloperToken();
    if (!developerToken) return;
    const musicKitConfig = {
      developerToken,
      app: {
        name: "Aria",
        build: "1.0.0"
      }
    };
    await window.MusicKit.configure(musicKitConfig);
    music = await window.MusicKit.getInstance();
    musicKitReadyResolve?.();
    if (music.isAuthorized) {
      fetchUserLibrary();
    }

    music?.addEventListener("playbackStateDidChange", () => {
      if (music?.playbackState === MusicKit.PlaybackStates.ended) {
        host.finishPlayback();
      }
    });
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
        tokenExpiration: data.expiresAt
      });
      return data.token;
    } catch (error) {
      console.error("Failed to fetch developer token:", error);
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
      total: totalTracks
    });

    const allTracks: TrackMetadata[] = [];
    const tracksLimit = 100;
    const maxConcurrentRequests = 5;
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
              total: totalTracks
            });
          }
        }

        if (!music?.isAuthorized) return;

        if (allTracks.length > 0) {
          host.updateTracks([...allTracks]);
        }
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
              Date.now()
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
    dateAdded: number
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
      dateAdded,
      year:
        albumData.attributes?.releaseDate &&
        parseInt(albumData.attributes.releaseDate.split("-")[0]),
      metadataLoaded: true
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
      ...Object.values(albumToArtistIds).flat()
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
          ).artwork?.url
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
        albumUri: albumId
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
    const urls: string[] = [];
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize).join(",");
      urls.push(`${endpoint}?ids=${batch}`);
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
    if (!getTokenEndpoint()) {
      host.showAlert({
        heading: i18n.t(
          "apple-music-player:errorDialog.tokenEndpointRequiredHeading"
        ),
        message: i18n.t(
          "apple-music-player:errorDialog.tokenEndpointRequiredMessage"
        ),
        closeLabel: i18n.t("apple-music-player:errorDialog.close")
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
        closeLabel: i18n.t("apple-music-player:errorDialog.close")
      });
      return;
    }
    await initialize();
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
    host.removeArtists();
  }

  return {
    displayName: "Apple Music",

    disableAutomaticTrackSkip: true,

    LibraryConfig: (props) =>
      LibraryConfig({ ...props, host, authenticate, logout, i18n }),

    QuickStart: (props) => QuickStart({ ...props, authenticate, i18n }),

    loadAndPlayTrack: async (track: Track) => {
      if (music) {
        (music as unknown as MusicKit.Player).volume = host.getMuted()
          ? 0
          : host.getVolume() / 100;
      }
      await music?.setQueue({ song: track.uri });
      await music?.play();
    },

    getTrackArtwork: async (artworkUri) => {
      return artworkUri?.replace("{w}", "1000").replace("{h}", "1000");
    },

    getArtistArtwork: async (artworkUri) => {
      return artworkUri?.replace("{w}", "1000").replace("{h}", "1000");
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
        const catalogIds: string[] = [];
        const catalogIdMap = new Map<string, string>();
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
            if (
              albumAttributes?.releaseDate &&
              track.attributes?.playParams?.catalogId
            ) {
              catalogIds.push(track.attributes.playParams.catalogId);
              catalogIdMap.set(track.id, track.attributes.playParams.catalogId);
            }

            tracks.push(
              getTrackMetadata(
                track,
                { id: albumData.id, attributes: albumAttributes },
                Date.now()
              )
            );
          });

          hasMore = albumTracks.length === tracksLimit;
          tracksOffset += tracksLimit;
        }

        if (tracks.length === 0) {
          throw new Error(`No tracks found for album: ${uri}`);
        }

        const catalogIdRecord: Record<string, string> = {};
        catalogIdMap.forEach((catalogId, trackId) => {
          catalogIdRecord[trackId] = catalogId;
        });
        await addCatalogArtistsToTracks(tracks, catalogIdRecord);

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
          artworkUri: undefined
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
          tracks.push(getTrackMetadata(track, albumData, Date.now()));
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
          `v1/catalog/${music.storefrontId}/artists/${uri}/albums?limit=${limit}&offset=${startIndex}&include=artists`
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
            artworkUri: album.attributes?.artwork?.url
          };
        });
      } catch (error) {
        console.error("Failed to fetch artist albums:", error);
        return [];
      }
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
      if (!music && (data as AppleMusicConfig).tokenEndpoint) {
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
