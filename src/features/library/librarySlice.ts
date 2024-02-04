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
import { Item, moveTreeNode, updateTreeNode } from "soprano-ui";

const tracksAdapter = createEntityAdapter<Track>();

interface LibraryState {
  tracks: EntityState<Track>;
  columnState: ColumnState[] | null;
  layout: Item[];
}

const initialState: LibraryState = {
  tracks: tracksAdapter.getInitialState(),
  columnState: null,
  layout: [
    { id: "songs", name: "songs" },
    { id: "albums", name: "albums" },
    { id: "artists", name: "artists" },
    { id: "genres", name: "genres" },
    { id: "composers", name: "composers", hidden: true },
    { id: "years", name: "years", hidden: true }
  ]
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
    },
    moveLibraryItem: (
      state,
      action: PayloadAction<{
        id: string;
        parentId: string | null;
        index: number;
      }>
    ) => {
      state.layout = moveTreeNode(state.layout, action.payload);
    },
    updateLibraryItem: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Item> }>
    ) => {
      state.layout = updateTreeNode(state.layout, action.payload);
    },
    resetLibraryLayout: (state) => {
      state.layout = initialState.layout;
    }
  }
});

export const {
  addTracks,
  removeTracks,
  setColumnState,
  moveLibraryItem,
  updateLibraryItem,
  resetLibraryLayout
} = librarySlice.actions;

export const {
  selectIds: selectTrackIds,
  selectAll: selectAllTracks,
  selectById: selectTrackById
} = tracksAdapter.getSelectors((state: RootState) => state.library.tracks);
export const selectColumnState = (state: RootState) =>
  state.library.columnState;
export const selectLibraryLayout = (state: RootState) => state.library.layout;

export default librarySlice.reducer;

setupLibraryListeners();
