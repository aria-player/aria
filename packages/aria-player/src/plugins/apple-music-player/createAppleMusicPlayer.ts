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
        const trackMetadata = {
          uri: track.id,
          title: track.attributes?.name,
          artist: track.attributes?.artistName,
          albumArtist: albumData.attributes?.artistName,
          album: track.attributes?.albumName,
          albumUri: albumData.id,
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

      const artistData = await fetchCatalogArtists(
        Object.values(libraryToCatalogMap)
      );
      tracks.forEach((track) => {
        const data = artistData[libraryToCatalogMap[track.uri]];
        if (data?.artist?.length) {
          track.artist = data.artist;
          track.artistUri = data.artistUri;
        }
        if (data?.albumArtist?.length) {
          track.albumArtist = data.albumArtist;
          track.albumArtistUri = data.albumArtistUri;
        }
      });

      return { tracks, artists: Object.keys(artistData) };
    } catch (error) {
      console.error("Error fetching tracks:", error);
      return null;
    }
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
        albumArtistUri
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
