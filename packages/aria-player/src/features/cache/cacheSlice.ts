import { createSlice, nanoid, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { AlbumId, ArtistId, TrackId } from "../../../../types";
import { parseTrackId } from "../../app/utils";
import { PluginId } from "../../../../types/plugins";

const updateAtOffset = <T>(
  currentData: T[] | undefined,
  newData: T[],
  offset: number
) => {
  const merged = [...(currentData || [])];
  newData.forEach((id, index) => {
    const targetPosition = offset + index;
    const existingIndex = merged.indexOf(id);
    if (existingIndex !== -1) {
      merged.splice(existingIndex, 1);
    }
    const boundedPosition = Math.min(targetPosition, merged.length);
    if (boundedPosition === merged.length) {
      merged.push(id);
    } else {
      merged.splice(boundedPosition, 0, id);
    }
  });
  return merged;
};

export interface CacheState {
  fetchedAlbums: AlbumId[];
  artistTopTracks: Record<ArtistId, TrackId[]>;
  artistAlbums: Record<ArtistId, AlbumId[]>;
  search: {
    tracks: Record<string, TrackId[]>;
    albums: Record<string, AlbumId[]>;
    artists: Record<string, ArtistId[]>;
  };
  playlistTrackUris: Record<
    string,
    { uris: (string | null)[]; ids: string[]; total: number }
  >;
}

const initialState: CacheState = {
  fetchedAlbums: [],
  artistTopTracks: {},
  artistAlbums: {},
  search: {
    tracks: {},
    albums: {},
    artists: {},
  },
  playlistTrackUris: {},
};

export const cacheSlice = createSlice({
  name: "cache",
  initialState,
  reducers: {
    markAlbumFetched: (state, action: PayloadAction<AlbumId>) => {
      if (!state.fetchedAlbums.includes(action.payload)) {
        state.fetchedAlbums.push(action.payload);
      }
    },
    updateCachedArtistTopTracks: (
      state,
      action: PayloadAction<{
        artistId: ArtistId;
        trackIds: TrackId[];
        offset: number;
      }>
    ) => {
      const { artistId, trackIds, offset } = action.payload;
      state.artistTopTracks[artistId] = updateAtOffset(
        state.artistTopTracks[artistId],
        trackIds,
        offset
      );
    },
    updateCachedArtistAlbums: (
      state,
      action: PayloadAction<{
        artistId: ArtistId;
        albumIds: AlbumId[];
        offset: number;
      }>
    ) => {
      const { artistId, albumIds, offset } = action.payload;
      state.artistAlbums[artistId] = updateAtOffset(
        state.artistAlbums[artistId],
        albumIds,
        offset
      );
    },
    updateCachedSearchTracks: (
      state,
      action: PayloadAction<{
        key: string;
        trackIds: TrackId[];
        offset: number;
      }>
    ) => {
      const { key, trackIds, offset } = action.payload;
      state.search.tracks[key] = updateAtOffset(
        state.search.tracks[key],
        trackIds,
        offset
      );
    },
    updateCachedSearchAlbums: (
      state,
      action: PayloadAction<{
        key: string;
        albumIds: AlbumId[];
        offset: number;
      }>
    ) => {
      const { key, albumIds, offset } = action.payload;
      state.search.albums[key] = updateAtOffset(
        state.search.albums[key],
        albumIds,
        offset
      );
    },
    updateCachedSearchArtists: (
      state,
      action: PayloadAction<{
        key: string;
        artistIds: ArtistId[];
        offset: number;
      }>
    ) => {
      const { key, artistIds, offset } = action.payload;
      state.search.artists[key] = updateAtOffset(
        state.search.artists[key],
        artistIds,
        offset
      );
    },
    initPlaylistTrackUris: {
      reducer: (
        state,
        action: PayloadAction<{
          playlistId: string;
          uris: string[];
          total: number;
          offset: number;
          ids: string[];
        }>
      ) => {
        const { playlistId, uris, total, offset, ids } = action.payload;
        const sparse: (string | null)[] = new Array(total).fill(null);
        uris.forEach((uri, i) => {
          sparse[offset + i] = uri;
        });
        state.playlistTrackUris[playlistId] = { uris: sparse, ids, total };
      },
      prepare: (payload: {
        playlistId: string;
        uris: string[];
        total: number;
        offset: number;
      }) => ({
        payload: {
          ...payload,
          ids: Array.from({ length: payload.total }, () => nanoid()),
        },
      }),
    },
    setPlaylistTrackUrisPage: (
      state,
      action: PayloadAction<{
        playlistId: string;
        uris: string[];
        offset: number;
      }>
    ) => {
      const { playlistId, uris, offset } = action.payload;
      const entry = state.playlistTrackUris[playlistId];
      if (!entry) return;
      uris.forEach((uri, i) => {
        entry.uris[offset + i] = uri;
      });
    },
    removePlaylistTrackUris: (
      state,
      action: PayloadAction<{ playlistId: string; uris: string[] }>
    ) => {
      const { playlistId, uris } = action.payload;
      const entry = state.playlistTrackUris[playlistId];
      if (!entry) return;
      const uriSet = new Set(uris);
      const keptUris: (string | null)[] = [];
      const keptIds: string[] = [];
      entry.uris.forEach((uri, index) => {
        if (uri === null || !uriSet.has(uri)) {
          keptUris.push(uri);
          keptIds.push(entry.ids[index]);
        }
      });
      entry.uris = keptUris;
      entry.ids = keptIds;
      entry.total = keptUris.length;
    },
    reorderPlaylistTrackUris: (
      state,
      action: PayloadAction<{
        playlistId: string;
        rangeStart: number;
        insertBefore: number;
        rangeLength: number;
      }>
    ) => {
      const { playlistId, rangeStart, insertBefore, rangeLength } =
        action.payload;
      const entry = state.playlistTrackUris[playlistId];
      if (!entry) return;
      const insertIndex =
        insertBefore > rangeStart ? insertBefore - rangeLength : insertBefore;
      const movedUris = entry.uris.splice(rangeStart, rangeLength);
      entry.uris.splice(insertIndex, 0, ...movedUris);
      const movedIds = entry.ids.splice(rangeStart, rangeLength);
      entry.ids.splice(insertIndex, 0, ...movedIds);
    },
    clearCache: (state) => {
      state.fetchedAlbums = [];
      state.artistTopTracks = {};
      state.artistAlbums = {};
      state.search = {
        tracks: {},
        albums: {},
        artists: {},
      };
      state.playlistTrackUris = {};
    },
    removeCachedTracks: (
      state,
      action: PayloadAction<{
        source: PluginId;
        tracks?: TrackId[];
      }>
    ) => {
      const trackIdsToRemove = action.payload.tracks
        ? new Set(action.payload.tracks)
        : null;
      const shouldRemoveTrack = (trackId: TrackId) =>
        trackIdsToRemove
          ? trackIdsToRemove.has(trackId)
          : parseTrackId(trackId)?.source === action.payload.source;

      Object.keys(state.artistTopTracks).forEach((artistId) => {
        const remainingTracks = state.artistTopTracks[artistId].filter(
          (trackId) => !shouldRemoveTrack(trackId)
        );
        if (remainingTracks.length > 0) {
          state.artistTopTracks[artistId] = remainingTracks;
        } else {
          delete state.artistTopTracks[artistId];
        }
      });

      Object.keys(state.search.tracks).forEach((key) => {
        const remainingTracks = state.search.tracks[key].filter(
          (trackId) => !shouldRemoveTrack(trackId)
        );
        if (remainingTracks.length > 0) {
          state.search.tracks[key] = remainingTracks;
        } else {
          delete state.search.tracks[key];
        }
      });
    },
  },
});

export const {
  markAlbumFetched,
  updateCachedArtistTopTracks,
  updateCachedArtistAlbums,
  updateCachedSearchTracks,
  updateCachedSearchAlbums,
  updateCachedSearchArtists,
  initPlaylistTrackUris,
  setPlaylistTrackUrisPage,
  removePlaylistTrackUris,
  reorderPlaylistTrackUris,
  clearCache,
  removeCachedTracks,
} = cacheSlice.actions;

export const selectIsAlbumFetched = (state: RootState, albumId: AlbumId) =>
  state.cache.fetchedAlbums.includes(albumId);

export const selectCachedArtistTopTracks = (
  state: RootState,
  artistId: ArtistId
) => state.cache.artistTopTracks[artistId];

export const selectCachedArtistAlbums = (
  state: RootState,
  artistId: ArtistId
) => state.cache.artistAlbums[artistId];

export const selectCachedSearchTracks = (state: RootState, key: string) =>
  state.cache.search.tracks[key];

export const selectCachedSearchAlbums = (state: RootState, key: string) =>
  state.cache.search.albums[key];

export const selectCachedSearchArtists = (state: RootState, key: string) =>
  state.cache.search.artists[key];

export const selectCachedPlaylistTrackUris = (
  state: RootState,
  playlistId: string
) => state.cache.playlistTrackUris[playlistId] ?? null;

export default cacheSlice.reducer;
