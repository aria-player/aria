import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice,
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import {
  Item,
  createTreeNode,
  deleteTreeNode,
  findTreeNode,
  moveTreeNode,
  updateTreeNode,
} from "soprano-ui";
import {
  PlaylistConfig,
  PlaylistId,
  PlaylistItem,
  PlaylistItemId,
  PlaylistUndoable,
} from "./playlistsTypes";
import { setupPlaylistsListeners } from "./playlistsListeners";
import { ColumnState } from "ag-grid-community";
import {
  filterHiddenColumnSort,
  getTrackId,
  overrideColumnStateSort,
  resetColumnStateExceptSort,
} from "../../app/utils";
import { DisplayMode, SplitViewState, TrackGrouping } from "../../app/view";
import { PluginId, PlaylistPermissions, TrackUri } from "../../../../types";
import { AppThunk } from "../../app/store";
import { createAppAsyncThunk } from "../../app/thunk";
import { nanoid } from "@reduxjs/toolkit";
import { pluginHandles } from "../plugins/pluginsSlice";
import {
  initPlaylistTrackUris,
  removePlaylistTrackUris,
  reorderPlaylistTrackUris,
  selectCachedPlaylistTrackUris,
  setPlaylistTrackUrisPage,
} from "../cache/cacheSlice";
import { selectTrackById } from "../tracks/tracksSlice";
import { showToast } from "../../app/toasts";
import { t } from "i18next";

const playlistsAdapter = createEntityAdapter<PlaylistUndoable>();
const playlistsConfigAdapter = createEntityAdapter<PlaylistConfig>();

export type PlaylistOperation = "rename" | "delete";

export interface PlaylistsState {
  playlists: EntityState<PlaylistUndoable, PlaylistId>;
  playlistsConfig: EntityState<PlaylistConfig, PlaylistId>;
  layout: Item[];
  openFolders: string[];
  pendingOperations: Partial<Record<string, PlaylistOperation>>;
  slowOperations: Partial<Record<string, PlaylistOperation>>;
}

const initialState: PlaylistsState = {
  playlists: playlistsAdapter.getInitialState(),
  playlistsConfig: playlistsConfigAdapter.getInitialState(),
  layout: [],
  openFolders: [],
  pendingOperations: {},
  slowOperations: {},
};

export const PLAYLIST_URI_PAGE_SIZE = 100;
const SLOW_OPERATION_DELAY_MS = 600;

const operationTimers = new Map<string, ReturnType<typeof setTimeout>>();

export function startPlaylistOperation(
  id: string,
  operation: PlaylistOperation
): AppThunk {
  return (dispatch) => {
    dispatch(setPendingOperation({ id, operation }));
    operationTimers.set(
      id,
      setTimeout(() => {
        dispatch(setSlowOperation({ id, operation }));
      }, SLOW_OPERATION_DELAY_MS)
    );
  };
}

export function finishPlaylistOperation(id: string): AppThunk {
  return (dispatch) => {
    clearTimeout(operationTimers.get(id));
    operationTimers.delete(id);
    dispatch(clearOperation(id));
  };
}

export function addPlaylistTracksThunk(
  playlistId: string,
  trackIds: string[]
): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const playlist = selectPlaylistById(state, playlistId);
    if (playlist?.provider) {
      const { provider } = playlist;
      const uris = trackIds
        .map((id) => selectTrackById(state, id)?.uri)
        .filter(Boolean) as string[];
      if (!uris.length) return;
      const playlistName = selectPlaylistsLayoutItemById(
        state,
        playlistId
      )?.name;
      if (trackIds.length === 1) {
        showToast(
          t("toasts.addedNamedTrackToPlaylist", {
            title: selectTrackById(state, trackIds[0])?.title,
            playlist: playlistName,
          })
        );
      } else {
        showToast(
          t("toasts.addedTracksToPlaylist", {
            count: trackIds.length,
            playlist: playlistName,
          })
        );
      }
      try {
        await pluginHandles[provider]?.addPlaylistTracks?.(playlistId, uris);
        dispatch(initExternalPlaylist({ playlistId, provider }));
      } catch {
        showToast(
          t("toasts.addToExternalPlaylistError", { playlist: playlistName })
        );
      }
    } else {
      dispatch(
        addTracksToPlaylist({
          playlistId,
          newTracks: trackIds.map((trackId) => ({ itemId: nanoid(), trackId })),
        })
      );
    }
  };
}

export function removePlaylistTracksThunk(
  playlistId: string,
  tracks: PlaylistItem[]
): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const playlist = selectPlaylistById(state, playlistId);
    if (playlist?.provider) {
      const { provider } = playlist;
      const uris = tracks
        .map((track) => selectTrackById(state, track.trackId)?.uri)
        .filter(Boolean) as string[];
      if (!uris.length) return;
      const playlistName = selectPlaylistsLayoutItemById(
        state,
        playlistId
      )?.name;
      try {
        await pluginHandles[provider]?.removePlaylistTracks?.(playlistId, uris);
        dispatch(removePlaylistTrackUris({ playlistId, uris }));
        dispatch(initExternalPlaylist({ playlistId, provider }));
      } catch {
        showToast(
          t("toasts.removeFromExternalPlaylistError", {
            playlist: playlistName,
          })
        );
      }
    } else {
      dispatch(
        removeTracksFromPlaylist({
          playlistId,
          itemIds: tracks.map((track) => track.itemId),
        })
      );
    }
  };
}

export function computeRangeMove(
  oldUris: (string | null)[],
  newUris: (string | null)[]
): { rangeStart: number; insertBefore: number; rangeLength: number } | null {
  if (oldUris.length !== newUris.length) return null;
  const length = oldUris.length;
  let prefix = 0;
  while (prefix < length && oldUris[prefix] === newUris[prefix]) prefix++;
  if (prefix === length) return null;
  let suffix = 0;
  while (
    suffix < length - prefix &&
    oldUris[length - 1 - suffix] === newUris[length - 1 - suffix]
  )
    suffix++;
  const windowLength = length - prefix - suffix;
  const oldWindow = oldUris.slice(prefix, prefix + windowLength);
  const newWindow = newUris.slice(prefix, prefix + windowLength);
  for (let rotation = 1; rotation < windowLength; rotation++) {
    const rotated = oldWindow
      .slice(rotation)
      .concat(oldWindow.slice(0, rotation));
    if (rotated.every((uri, index) => uri === newWindow[index])) {
      if (rotation <= windowLength - rotation) {
        return {
          rangeStart: prefix,
          insertBefore: prefix + windowLength,
          rangeLength: rotation,
        };
      }
      return {
        rangeStart: prefix + rotation,
        insertBefore: prefix,
        rangeLength: windowLength - rotation,
      };
    }
  }
  return null;
}

export function reorderPlaylistTracksThunk(
  playlistId: string,
  newUris: (string | null)[]
): AppThunk<Promise<void>> {
  return async (dispatch, getState) => {
    const state = getState();
    const playlist = selectPlaylistById(state, playlistId);
    if (!playlist?.provider) return;
    const { provider } = playlist;
    const oldUris = selectCachedPlaylistTrackUris(state, playlistId)?.uris;
    if (!oldUris) return;
    const move = computeRangeMove(oldUris, newUris);
    if (!move) {
      dispatch(initExternalPlaylist({ playlistId, provider }));
      return;
    }
    const playlistName = selectPlaylistsLayoutItemById(state, playlistId)?.name;
    // We avoid resyncing after success here to avoid cutting off the row reorder animations
    dispatch(reorderPlaylistTrackUris({ playlistId, ...move }));
    try {
      await pluginHandles[provider]?.reorderPlaylistTracks?.(
        playlistId,
        move.rangeStart,
        move.insertBefore,
        move.rangeLength
      );
    } catch {
      dispatch(initExternalPlaylist({ playlistId, provider }));
      showToast(
        t("toasts.reorderExternalPlaylistError", { playlist: playlistName })
      );
    }
  };
}

export const initExternalPlaylist = createAppAsyncThunk(
  "playlists/initExternalPlaylist",
  async (
    { playlistId, provider }: { playlistId: PlaylistId; provider: PluginId },
    { dispatch }
  ) => {
    const plugin = pluginHandles[provider];
    if (!plugin?.getPlaylistTracks) return;
    const { uris, total } = await plugin.getPlaylistTracks(
      playlistId,
      0,
      PLAYLIST_URI_PAGE_SIZE
    );
    dispatch(initPlaylistTrackUris({ playlistId, uris, total, offset: 0 }));
    return { uris, total };
  }
);

export const fetchPlaylistTrackUrisPage = createAppAsyncThunk(
  "playlists/fetchPlaylistTrackUrisPage",
  async (
    {
      playlistId,
      provider,
      offset,
    }: { playlistId: PlaylistId; provider: PluginId; offset: number },
    { dispatch }
  ) => {
    const plugin = pluginHandles[provider];
    if (!plugin?.getPlaylistTracks) return;
    const { uris } = await plugin.getPlaylistTracks(
      playlistId,
      offset,
      offset + PLAYLIST_URI_PAGE_SIZE
    );
    dispatch(setPlaylistTrackUrisPage({ playlistId, uris, offset }));
    return uris;
  }
);

export const fetchPlaylistTracks = createAppAsyncThunk(
  "playlists/fetchPlaylistTracks",
  async (
    { playlistId, provider }: { playlistId: PlaylistId; provider: PluginId },
    { dispatch, getState }
  ) => {
    const plugin = pluginHandles[provider];
    if (!plugin || plugin.getTracksByUri || !plugin.getPlaylistTracks) return;
    let offset = 0;
    let total = Infinity;
    const allUris: TrackUri[] = [];
    while (offset < total) {
      const result = await plugin.getPlaylistTracks(
        playlistId,
        offset,
        offset + PLAYLIST_URI_PAGE_SIZE
      );
      total = result.total;
      allUris.push(...result.uris);
      offset += PLAYLIST_URI_PAGE_SIZE;
    }
    const state = getState();
    const availableTrackIds = allUris
      .map((uri) => getTrackId(provider, uri))
      .filter((trackId) => state.tracks.tracks.entities[trackId]);
    dispatch(
      syncExternalPlaylistTracks({
        playlistId,
        provider,
        uris: allUris,
        availableTrackIds,
      })
    );
  }
);

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
        isFolder: boolean;
      }>
    ) => {
      state.layout = moveTreeNode(state.layout, action.payload);
    },
    updatePlaylistItem: (
      state,
      action: PayloadAction<{
        id: string;
        changes: Partial<Item>;
        isFolder: boolean;
      }>
    ) => {
      state.layout = updateTreeNode(state.layout, action.payload);
    },
    createPlaylistItem: (
      state,
      action: PayloadAction<{
        newData: Item;
        parentId?: string | undefined;
        index?: number | undefined;
        provider?: PluginId;
      }>
    ) => {
      state.layout = createTreeNode(state.layout, action.payload);
      if (action.payload.newData.children == undefined) {
        playlistsAdapter.addOne(state.playlists, {
          id: action.payload.newData.id,
          tracks: [],
          provider: action.payload.provider,
        });
        playlistsConfigAdapter.addOne(state.playlistsConfig, {
          id: action.payload.newData.id,
          columnState: null,
          useCustomLayout: false,
          displayMode: DisplayMode.TrackList,
          splitViewState: { trackGrouping: TrackGrouping.Artist },
        });
      }
    },
    deletePlaylistItem: (
      state,
      action: PayloadAction<{ id: string; isFolder: boolean }>
    ) => {
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
    setPendingOperation: (
      state,
      action: PayloadAction<{ id: string; operation: PlaylistOperation }>
    ) => {
      state.pendingOperations[action.payload.id] = action.payload.operation;
    },
    setSlowOperation: (
      state,
      action: PayloadAction<{ id: string; operation: PlaylistOperation }>
    ) => {
      state.slowOperations[action.payload.id] = action.payload.operation;
    },
    clearOperation: (state, action: PayloadAction<string>) => {
      delete state.pendingOperations[action.payload];
      delete state.slowOperations[action.payload];
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
    syncExternalPlaylistTracks: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        provider: PluginId;
        uris: TrackUri[];
        availableTrackIds: string[];
      }>
    ) => {
      const { playlistId, provider, uris, availableTrackIds } = action.payload;
      const item = state.playlists.entities[playlistId];
      if (!item || item.provider !== provider) return;

      const availableTrackIdsSet = new Set(availableTrackIds);
      const existingItemsByTrackId = new Map<string, PlaylistItem[]>();
      item.tracks.forEach((playlistItem) => {
        const existingItems = existingItemsByTrackId.get(playlistItem.trackId);
        if (existingItems) {
          existingItems.push(playlistItem);
        } else {
          existingItemsByTrackId.set(playlistItem.trackId, [playlistItem]);
        }
      });

      item.tracks = uris
        .map((uri) => {
          const trackId = getTrackId(provider, uri);
          if (!availableTrackIdsSet.has(trackId)) return null;
          return (
            existingItemsByTrackId.get(trackId)?.shift() ?? {
              itemId: nanoid(),
              trackId,
            }
          );
        })
        .filter(
          (playlistItem): playlistItem is PlaylistItem => playlistItem !== null
        );
    },
    upsertExternalPlaylist: (
      state,
      action: PayloadAction<{
        id: string;
        name: string;
        provider: PluginId;
        permissions: PlaylistPermissions;
        orderable?: boolean;
        artworkUri?: string;
      }>
    ) => {
      const { id, name, provider, permissions, orderable, artworkUri } =
        action.payload;
      const existingNode = findTreeNode(state.layout, id);
      const existingPlaylist = state.playlists.entities[id];

      if (existingPlaylist && existingPlaylist.provider !== provider) return;

      if (!existingNode) {
        state.layout = createTreeNode(state.layout, {
          newData: { id, name },
        });
        if (!existingPlaylist) {
          playlistsAdapter.addOne(state.playlists, {
            id,
            tracks: [],
            provider,
            permissions,
            orderable,
            artworkUri,
          });
          playlistsConfigAdapter.addOne(state.playlistsConfig, {
            id,
            columnState: null,
            useCustomLayout: false,
            displayMode: DisplayMode.TrackList,
            splitViewState: { trackGrouping: TrackGrouping.Artist },
          });
        }
      } else {
        state.layout = updateTreeNode(state.layout, {
          id,
          changes: { name },
        });
        playlistsAdapter.updateOne(state.playlists, {
          id,
          changes: { permissions, orderable, artworkUri },
        });
      }
    },
    removeExternalPlaylists: (
      state,
      action: PayloadAction<{ provider: PluginId; ids?: string[] }>
    ) => {
      const { provider, ids } = action.payload;
      const idsToRemove =
        ids ??
        Object.values(state.playlists.entities)
          .filter((playlist) => playlist?.provider === provider)
          .map((playlist) => playlist!.id);

      for (const id of idsToRemove) {
        if (state.playlists.entities[id]?.provider !== provider) continue;
        if (findTreeNode(state.layout, id)) {
          const deletion = deleteTreeNode(state.layout, { id });
          state.layout = deletion.result;
          playlistsAdapter.removeMany(state.playlists, deletion.deletedIds);
          playlistsConfigAdapter.removeMany(
            state.playlistsConfig,
            deletion.deletedIds
          );
        } else {
          playlistsAdapter.removeOne(state.playlists, id);
          playlistsConfigAdapter.removeOne(state.playlistsConfig, id);
        }
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
          playlistConfig.splitViewState.selectedGroup = null;
        }
        playlistConfig.displayMode = action.payload.displayMode;
      }
    },
    updatePlaylistSplitViewState: (
      state,
      action: PayloadAction<{
        playlistId: PlaylistId;
        splitState: Partial<SplitViewState>;
      }>
    ) => {
      const playlistConfig =
        state.playlistsConfig.entities[action.payload.playlistId];
      if (playlistConfig) {
        playlistConfig.splitViewState = {
          ...playlistConfig.splitViewState,
          ...action.payload.splitState,
        };
      }
    },
  },
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
  syncExternalPlaylistTracks,
  upsertExternalPlaylist,
  removeExternalPlaylists,
  resetPlaylistColumnState,
  updatePlaylistColumnState,
  togglePlaylistUsesCustomLayout,
  setPlaylistDisplayMode,
  updatePlaylistSplitViewState,
  setPendingOperation,
  setSlowOperation,
  clearOperation,
} = playlistsSlice.actions;

export const selectPlaylistsLayout = (state: RootState) =>
  state.undoable.present.playlists.layout;
export const selectOpenFolders = (state: RootState) =>
  state.undoable.present.playlists.openFolders;
export const selectPendingPlaylistOperations = (state: RootState) =>
  state.undoable.present.playlists.pendingOperations;
export const selectSlowPlaylistOperations = (state: RootState) =>
  state.undoable.present.playlists.slowOperations;

export const selectPlaylistsLayoutItemById = createSelector(
  [selectPlaylistsLayout, (_: RootState, nodeId: string) => nodeId],
  (items, nodeId) => findTreeNode(items, nodeId)
);

export const {
  selectIds: selectPlaylistIds,
  selectAll: selectAllPlaylists,
  selectById: selectPlaylistById,
} = playlistsAdapter.getSelectors(
  (state: RootState) => state.undoable.present.playlists.playlists
);

export const { selectById: selectPlaylistConfigById } =
  playlistsConfigAdapter.getSelectors(
    (state: RootState) => state.undoable.present.playlists.playlistsConfig
  );

export default playlistsSlice.reducer;

setupPlaylistsListeners();
