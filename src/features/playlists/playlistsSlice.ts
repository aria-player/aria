import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import {
  Item,
  createTreeNode,
  deleteTreeNode,
  findTreeNode,
  moveTreeNode,
  updateTreeNode
} from "soprano-ui";
import {
  PlaylistConfig,
  PlaylistId,
  PlaylistItem,
  PlaylistItemId,
  PlaylistUndoable
} from "./playlistsTypes";
import { setupPlaylistsListeners } from "./playlistsListeners";
import { ColumnState } from "@ag-grid-community/core";
import {
  overrideColumnStateSort,
  resetColumnStateExceptSort
} from "../../app/utils";

const playlistsAdapter = createEntityAdapter<PlaylistUndoable>();
const playlistsConfigAdapter = createEntityAdapter<PlaylistConfig>();

export interface PlaylistsState {
  playlists: EntityState<PlaylistUndoable>;
  playlistsConfig: EntityState<PlaylistConfig>;
  layout: Item[];
  openFolders: string[];
}

const initialState: PlaylistsState = {
  playlists: playlistsAdapter.getInitialState(),
  playlistsConfig: playlistsConfigAdapter.getInitialState(),
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
      if (action.payload.newData.children == undefined) {
        playlistsAdapter.addOne(state.playlists, {
          id: action.payload.newData.id,
          tracks: []
        });
        playlistsConfigAdapter.addOne(state.playlistsConfig, {
          id: action.payload.newData.id,
          columnState: null,
          useCustomLayout: false
        });
      }
    },
    deletePlaylistItem: (state, action: PayloadAction<{ id: string }>) => {
      const deletion = deleteTreeNode(state.layout, action.payload);
      state.layout = deletion.result;
      playlistsAdapter.removeMany(state.playlists, deletion.deletedIds);
      playlistsConfigAdapter.removeMany(
        state.playlistsConfig,
        deletion.deletedIds
      );
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
    },
    addTracksToPlaylist: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        newTracks: PlaylistItem[];
      }>
    ) => {
      const { playlistId, newTracks } = action.payload;
      const item = state.playlists.entities[playlistId];
      if (item) {
        item.tracks = item.tracks.concat(newTracks);
      }
    },
    removeTracksFromPlaylist: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        itemIds: PlaylistItemId[];
      }>
    ) => {
      const { playlistId, itemIds } = action.payload;
      const item = state.playlists.entities[playlistId];
      if (item) {
        item.tracks = item.tracks.filter(
          (track) => !itemIds.includes(track.itemId)
        );
      }
    },
    setPlaylistTracks: (
      state,
      action: PayloadAction<{ playlistId: PlaylistId; tracks: PlaylistItem[] }>
    ) => {
      const { playlistId, tracks } = action.payload;
      const item = state.playlists.entities[playlistId];
      if (item) {
        item.tracks = tracks;
      }
    },
    updatePlaylistColumnState: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        columnState: ColumnState[];
      }>
    ) => {
      const item = state.playlistsConfig.entities[action.payload.playlistId];
      if (item) {
        item.columnState = action.payload.columnState;
      }
    },
    resetPlaylistColumnState: (state, action: PayloadAction<PlaylistId>) => {
      const item = state.playlistsConfig.entities[action.payload];
      if (item) {
        item.columnState = resetColumnStateExceptSort(item.columnState);
      }
    },
    togglePlaylistUsesCustomLayout: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        libraryColumnState: ColumnState[] | null;
      }>
    ) => {
      const playlistConfig =
        state.playlistsConfig.entities[action.payload.playlistId];
      if (playlistConfig) {
        playlistConfig.useCustomLayout = !playlistConfig.useCustomLayout;
        if (action.payload.libraryColumnState) {
          // Reset column state except sort
          playlistConfig.columnState = overrideColumnStateSort(
            action.payload.libraryColumnState,
            playlistConfig.columnState
          );
        }
      }
    }
  }
});

export const {
  movePlaylistItem,
  updatePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem,
  openPlaylistFolder,
  closePlaylistFolder,
  addTracksToPlaylist,
  removeTracksFromPlaylist,
  setPlaylistTracks,
  resetPlaylistColumnState,
  updatePlaylistColumnState,
  togglePlaylistUsesCustomLayout
} = playlistsSlice.actions;

export const selectPlaylistsLayout = (state: RootState) =>
  state.undoable.present.playlists.layout;
export const selectOpenFolders = (state: RootState) =>
  state.undoable.present.playlists.openFolders;

export const selectPlaylistsLayoutItemById = createSelector(
  [selectPlaylistsLayout, (_: RootState, nodeId: string) => nodeId],
  (items, nodeId) => findTreeNode(items, nodeId)
);

export const {
  selectIds: selectPlaylistIds,
  selectAll: selectAllPlaylists,
  selectById: selectPlaylistById
} = playlistsAdapter.getSelectors(
  (state: RootState) => state.undoable.present.playlists.playlists
);

export const { selectById: selectPlaylistConfigById } =
  playlistsConfigAdapter.getSelectors(
    (state: RootState) => state.undoable.present.playlists.playlistsConfig
  );

export default playlistsSlice.reducer;

setupPlaylistsListeners();
