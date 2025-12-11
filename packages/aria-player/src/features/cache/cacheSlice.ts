import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { AlbumId } from "../../../../types";

export interface CacheState {
  fetchedAlbums: AlbumId[];
}

const initialState: CacheState = {
  fetchedAlbums: []
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
    clearCache: (state) => {
      state.fetchedAlbums = [];
    }
  }
});

export const { markAlbumFetched, clearCache } = cacheSlice.actions;

export const selectIsAlbumFetched = (state: RootState, albumId: AlbumId) =>
  state.cache.fetchedAlbums.includes(albumId);

export default cacheSlice.reducer;
