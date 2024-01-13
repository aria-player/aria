import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import { Track, TrackId } from "./libraryTypes";
import { PluginId } from "../plugins/pluginsTypes";
import { RootState } from "../../app/store";
import { setupLibraryListeners } from "./libraryListeners";
import { ColumnState } from "@ag-grid-community/core";

const tracksAdapter = createEntityAdapter<Track>();

interface LibraryState {
  tracks: EntityState<Track>;
  columnState: ColumnState[] | null;
}

const initialState: LibraryState = {
  tracks: tracksAdapter.getInitialState(),
  columnState: null
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    addTracks: (
      state,
      action: PayloadAction<{ source: PluginId; tracks?: Track[] }>
    ) => {
      tracksAdapter.upsertMany(state.tracks, action.payload.tracks ?? []);
    },
    removeTracks: (
      state,
      action: PayloadAction<{ source: PluginId; tracks?: TrackId[] }>
    ) => {
      const tracksToFilter = action.payload.tracks ?? state.tracks.ids;
      const tracksToRemove = tracksToFilter.filter(
        (trackId) =>
          state.tracks.entities[trackId]?.source === action.payload.source
      );
      tracksAdapter.removeMany(state.tracks, tracksToRemove);
    },
    setColumnState: (state, action: PayloadAction<ColumnState[]>) => {
      state.columnState = action.payload;
    }
  }
});

export const { addTracks, removeTracks, setColumnState } = librarySlice.actions;

export const {
  selectIds: selectTrackIds,
  selectAll: selectAllTracks,
  selectById: selectTrackById
} = tracksAdapter.getSelectors((state: RootState) => state.library.tracks);
export const selectColumnState = (state: RootState) =>
  state.library.columnState;

export default librarySlice.reducer;

setupLibraryListeners();
