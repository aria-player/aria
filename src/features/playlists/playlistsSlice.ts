import { PayloadAction, createSelector, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import {
  Item,
  createTreeNode,
  deleteTreeNode,
  findTreeNode,
  moveTreeNode,
  updateTreeNode
} from "soprano-ui";

export interface PlaylistsState {
  layout: Item[];
  openFolders: string[];
}

const initialState: PlaylistsState = {
  layout: [],
  openFolders: []
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    movePlaylistItem: (
      state,
      action: PayloadAction<{
        id: string;
        parentId: string | null;
        index: number;
      }>
    ) => {
      state.layout = moveTreeNode(state.layout, action.payload);
    },
    updatePlaylistItem: (
      state,
      action: PayloadAction<{ id: string; changes: Partial<Item> }>
    ) => {
      state.layout = updateTreeNode(state.layout, action.payload);
    },
    createPlaylistItem: (
      state,
      action: PayloadAction<{
        newData: Item;
        parentId?: string | undefined;
        index?: number | undefined;
      }>
    ) => {
      state.layout = createTreeNode(state.layout, action.payload);
    },
    deletePlaylistItem: (state, action: PayloadAction<{ id: string }>) => {
      state.layout = deleteTreeNode(state.layout, action.payload).result;
    },
    openPlaylistFolder: (state, action: PayloadAction<{ id: string }>) => {
      const itemId = action.payload.id;
      if (!state.openFolders.includes(itemId)) {
        state.openFolders.push(itemId);
      }
    },
    closePlaylistFolder: (state, action: PayloadAction<{ id: string }>) => {
      const itemId = action.payload.id;
      state.openFolders = state.openFolders.filter((id) => id !== itemId);
    }
  }
});

export const {
  movePlaylistItem,
  updatePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem,
  openPlaylistFolder,
  closePlaylistFolder
} = playlistsSlice.actions;

export const selectPlaylistsLayout = (state: RootState) =>
  state.undoable.present.playlists.layout;
export const selectOpenFolders = (state: RootState) =>
  state.undoable.present.playlists.openFolders;

export const selectPlaylistsLayoutItemById = createSelector(
  [selectPlaylistsLayout, (_: RootState, nodeId: string) => nodeId],
  (items, nodeId) => findTreeNode(items, nodeId)
);

export default playlistsSlice.reducer;
