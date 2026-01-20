import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { AlbumId, ArtistId, TrackId } from "../../../../types";

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
}

const initialState: CacheState = {
  fetchedAlbums: [],
  artistTopTracks: {},
  artistAlbums: {},
  search: {
    tracks: {},
    albums: {},
    artists: {}
  }
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
    clearCache: (state) => {
      state.fetchedAlbums = [];
      state.artistTopTracks = {};
      state.artistAlbums = {};
      state.search = {
        tracks: {},
        albums: {},
        artists: {}
      };
    }
  }
});

export const {
  markAlbumFetched,
  updateCachedArtistTopTracks,
  updateCachedArtistAlbums,
  updateCachedSearchTracks,
  updateCachedSearchAlbums,
  updateCachedSearchArtists,
  clearCache
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

export default cacheSlice.reducer;
