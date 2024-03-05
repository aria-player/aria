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
  filterHiddenColumnSort,
  overrideColumnStateSort,
  resetColumnStateExceptSort
} from "../../app/utils";
import { DisplayMode, TrackGrouping } from "../../app/view";

const playlistsAdapter = createEntityAdapter<PlaylistUndoable>();
const playlistsConfigAdapter = createEntityAdapter<PlaylistConfig>();

export interface PlaylistsState {
  playlists: EntityState<PlaylistUndoable, PlaylistId>;
  playlistsConfig: EntityState<PlaylistConfig, PlaylistId>;
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
          useCustomLayout: false,
          displayMode: DisplayMode.TrackList,
          splitViewSizes: null,
          trackGrouping: TrackGrouping.Artist,
          selectedGroup: null
        });
      }
    },
    deletePlaylistItem: (state, action: PayloadAction<{ id: string }>) => {
      const deletion = deleteTreeNode(state.layout, action.payload);
      state.layout = deletion.result;
      playlistsAdapter.removeMany(state.playlists, deletion.deletedIds);
    },
    cleanupPlaylistConfigs: (
      state,
      action: PayloadAction<{ deletedIds: PlaylistId[] }>
    ) => {
      playlistsConfigAdapter.removeMany(
        state.playlistsConfig,
        action.payload.deletedIds
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
        item.columnState = filterHiddenColumnSort(action.payload.columnState);
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
    },
    setPlaylistDisplayMode: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        displayMode: DisplayMode;
      }>
    ) => {
      const playlistConfig =
        state.playlistsConfig.entities[action.payload.playlistId];
      if (playlistConfig) {
        if (action.payload.displayMode != playlistConfig.displayMode) {
          playlistConfig.selectedGroup = null;
        }
        playlistConfig.displayMode = action.payload.displayMode;
      }
    },
    setPlaylistTrackGrouping: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        trackGrouping: TrackGrouping | null;
      }>
    ) => {
      const playlistConfig =
        state.playlistsConfig.entities[action.payload.playlistId];
      if (playlistConfig) {
        playlistConfig.trackGrouping = action.payload.trackGrouping;
      }
    },
    setPlaylistSelectedTrackGroup: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        selectedGroup: string | null;
      }>
    ) => {
      const playlistConfig =
        state.playlistsConfig.entities[action.payload.playlistId];
      if (playlistConfig) {
        playlistConfig.selectedGroup = action.payload.selectedGroup;
      }
    },
    updatePlaylistSplitViewSizes: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        splitSizes: number[];
      }>
    ) => {
      const playlistConfig =
        state.playlistsConfig.entities[action.payload.playlistId];
      if (playlistConfig) {
        playlistConfig.splitViewSizes = action.payload.splitSizes;
      }
    }
  }
});

export const {
  movePlaylistItem,
  updatePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem,
  cleanupPlaylistConfigs,
  openPlaylistFolder,
  closePlaylistFolder,
  addTracksToPlaylist,
  removeTracksFromPlaylist,
  setPlaylistTracks,
  resetPlaylistColumnState,
  updatePlaylistColumnState,
  togglePlaylistUsesCustomLayout,
  setPlaylistDisplayMode,
  setPlaylistSelectedTrackGroup,
  updatePlaylistSplitViewSizes,
  setPlaylistTrackGrouping
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
