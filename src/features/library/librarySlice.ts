import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { ColumnState } from "@ag-grid-community/core";
import { Item, moveTreeNode, updateTreeNode } from "soprano-ui";
import { resetColumnStateExceptSort } from "../../app/utils";

interface LibraryState {
  columnState: ColumnState[] | null;
  layout: Item[];
}

const initialState: LibraryState = {
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
    setLibraryColumnState: (state, action: PayloadAction<ColumnState[]>) => {
      state.columnState = action.payload;
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
    }
  }
});

export const {
  setLibraryColumnState,
  resetLibraryColumnState,
  moveLibraryItem,
  updateLibraryItem,
  resetLibraryLayout
} = librarySlice.actions;

export const selectLibraryColumnState = (state: RootState) =>
  state.undoable.present.library.columnState;
export const selectLibraryLayout = (state: RootState) =>
  state.undoable.present.library.layout;

export default librarySlice.reducer;
