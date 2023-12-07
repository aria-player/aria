import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import { Track, TrackId } from "./libraryTypes";
import { PluginId } from "../plugins/pluginsTypes";
import { RootState } from "../../app/store";

const tracksAdapter = createEntityAdapter<Track>();

interface LibraryState {
  tracks: EntityState<Track>;
}

const initialState: LibraryState = {
  tracks: tracksAdapter.getInitialState()
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    addTracks: (state, action: PayloadAction<Track[]>) => {
      tracksAdapter.upsertMany(state.tracks, action.payload);
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
    }
  }
});

export const { addTracks, removeTracks } = librarySlice.actions;

export const {
  selectIds: selectTrackIds,
  selectAll: selectAllTracks,
  selectById: selectTrackById
} = tracksAdapter.getSelectors((state: RootState) => state.library.tracks);

export default librarySlice.reducer;
