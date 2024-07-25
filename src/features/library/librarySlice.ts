import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { ColumnState } from "@ag-grid-community/core";
import { Item, moveTreeNode, updateTreeNode } from "soprano-ui";
import {
  filterHiddenColumnSort,
  resetColumnStateExceptSort
} from "../../app/utils";
import { SplitViewState, TrackGrouping } from "../../app/view";

interface LibraryState {
  columnState: ColumnState[] | null;
  layout: Item[];
  selectedAlbum: string | null;
  splitViewStates: Record<string, SplitViewState>;
}

const initialState: LibraryState = {
  columnState: null,
  layout: [
    { id: "songs", name: "songs" },
    { id: "artists", name: "artists" },
    { id: "albums", name: "albums" },
    { id: "genres", name: "genres" },
    { id: "composers", name: "composers", hidden: true },
    { id: "years", name: "years", hidden: true },
    { id: "folders", name: "folders", hidden: true }
  ],
  selectedAlbum: null,
  splitViewStates: {
    artists: { trackGrouping: TrackGrouping.Artist },
    genres: { trackGrouping: TrackGrouping.Genre },
    composers: { trackGrouping: TrackGrouping.Composer },
    years: { trackGrouping: TrackGrouping.Year },
    folders: { trackGrouping: TrackGrouping.FileFolder }
  }
};

const librarySlice = createSlice({
  name: "library",
  initialState,
  reducers: {
    setLibraryColumnState: (state, action: PayloadAction<ColumnState[]>) => {
      state.columnState = filterHiddenColumnSort(action.payload);
    },
    resetLibraryColumnState: (state) => {
      state.columnState = resetColumnStateExceptSort(state.columnState);
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
    },
    setSelectedAlbum: (state, action: PayloadAction<string | null>) => {
      state.selectedAlbum = action.payload;
    },
    updateLibrarySplitState: (
      state,
      action: PayloadAction<{
        view: string;
        splitState: Partial<SplitViewState>;
      }>
    ) => {
      state.splitViewStates[action.payload.view] = {
        ...state.splitViewStates[action.payload.view],
        ...action.payload.splitState
      };
    }
  }
});

export const {
  setLibraryColumnState,
  resetLibraryColumnState,
  moveLibraryItem,
  updateLibraryItem,
  resetLibraryLayout,
  setSelectedAlbum,
  updateLibrarySplitState
} = librarySlice.actions;

export const selectLibraryColumnState = (state: RootState) =>
  state.undoable.present.library.columnState;
export const selectLibraryLayout = (state: RootState) =>
  state.undoable.present.library.layout;
export const selectLibrarySplitViewStates = (state: RootState) =>
  state.undoable.present.library.splitViewStates;

export default librarySlice.reducer;
