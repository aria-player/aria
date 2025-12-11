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
}

const initialState: CacheState = {
  fetchedAlbums: [],
  artistTopTracks: {},
  artistAlbums: {}
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
    clearCache: (state) => {
      state.fetchedAlbums = [];
      state.artistTopTracks = {};
      state.artistAlbums = {};
    }
  }
});

export const {
  markAlbumFetched,
  updateCachedArtistTopTracks,
  updateCachedArtistAlbums,
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

export default cacheSlice.reducer;
