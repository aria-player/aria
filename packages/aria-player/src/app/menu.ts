import { AppDispatch, RootState, store } from "./store";
import { createSelector, nanoid } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api/core";
import { push, goBack, goForward } from "redux-first-history";
import { BASEPATH } from "./constants";
import { AgGridReact } from "@ag-grid-community/react";
import {
  resetLibraryColumnState,
  selectLibraryColumnState,
  selectLibrarySplitViewStates,
  setSelectedAlbum,
  updateLibrarySplitState
} from "../features/library/librarySlice";
import { defaultColumnDefinitions } from "../features/library/libraryColumns";
import { Status } from "../features/player/playerTypes";
import {
  cycleRepeatMode,
  nextTrack,
  pause,
  removeFromQueue,
  resume,
  setMuted,
  setVolume,
  toggleShuffle
} from "../features/player/playerSlice";
import { restartOrPreviousTrack } from "../features/player/playerTime";
import { ActionCreators } from "redux-undo";
import {
  addTracksToPlaylist,
  removeTracksFromPlaylist,
  resetPlaylistColumnState,
  selectPlaylistConfigById,
  setPlaylistDisplayMode,
  setPlaylistSelectedTrackGroup,
  togglePlaylistUsesCustomLayout,
  updatePlaylistSplitViewState
} from "../features/playlists/playlistsSlice";
import { copySelectedTracks } from "../features/tracks/tracksSlice";
import { PlaylistItem } from "../features/playlists/playlistsTypes";
import { View, DisplayMode, LibraryView, TrackGrouping } from "./view";
import {
  selectCurrentPlaylist,
  selectCurrentTrack,
  selectCurrentTrackItemId
} from "../features/currentSelectors";
import {
  selectVisiblePlaylist,
  selectVisiblePlaylistConfig,
  selectVisibleViewType,
  selectVisibleDisplayMode,
  selectVisibleSelectedTrackGroup
} from "../features/visibleSelectors";
import { setSearch } from "../features/search/searchSlice";
import { t } from "i18next";
import { getRedoActionLabel, getUndoActionLabel } from "./undo";

export interface MenuItem {
  id: string;
  shortcut?: string;
  submenu?: MenuItem[];
  maconly?: boolean;
  winlinuxonly?: boolean;
  keepopen?: boolean;
  checkbox?: boolean;
}

export interface MenuItemState {
  label?: string;
  disabled?: boolean;
  selected?: boolean;
}

export function handleMenuAction(
  action: string,
  dispatch: AppDispatch,
  grid?: AgGridReact | null
) {
  const state = store.getState();
  switch (action) {
    case "exit":
      invoke("exit");
      break;
    case "settings":
      dispatch(push(BASEPATH + "settings"));
      break;
    case "back":
      dispatch(goBack());
      break;
    case "forward":
      dispatch(goForward());
      break;
    case "about":
      dispatch(push(BASEPATH + "settings/about"));
      break;
    case "fullscreen":
      invoke("toggle_fullscreen");
      break;
    case "selectAll":
      grid?.api?.selectAll();
      break;
    case "resetColumns":
      {
        const playlist = selectVisiblePlaylist(state)?.id;
        if (selectVisiblePlaylistConfig(state)?.useCustomLayout && playlist) {
          dispatch(resetPlaylistColumnState(playlist));
        } else {
          dispatch(resetLibraryColumnState());
        }
      }
      break;
    case "togglePlay":
      if (state.player.status == Status.Playing) {
        dispatch(pause());
      } else if (state.player.status == Status.Paused) {
        dispatch(resume());
      }
      break;
    case "next":
      dispatch(nextTrack());
      break;
    case "previous":
      restartOrPreviousTrack();
      break;
    case "toggleShuffle":
      dispatch(toggleShuffle());
      break;
    case "toggleRepeat":
      dispatch(cycleRepeatMode());
      break;
    case "volumeUp":
      dispatch(setVolume(state.player.volume + 10));
      break;
    case "volumeDown":
      dispatch(setVolume(state.player.volume - 10));
      break;
    case "toggleMute":
      dispatch(setMuted(!state.player.muted));
      break;
    case "goToCurrent":
      {
        const queueSource = state.player.queueSource;
        const currentPlaylist = selectCurrentPlaylist(state);
        const currentTrack = selectCurrentTrack(state);
        if (currentTrack) {
          if (state.player.queueGrouping == TrackGrouping.AlbumId) {
            if (
              currentPlaylist?.id &&
              selectPlaylistConfigById(state, currentPlaylist.id).displayMode ==
                DisplayMode.AlbumGrid
            ) {
              dispatch(
                setPlaylistSelectedTrackGroup({
                  playlistId: currentPlaylist.id,
                  selectedGroup: state.player.queueSelectedGroup
                })
              );
            } else if (queueSource == LibraryView.Albums) {
              dispatch(setSelectedAlbum(state.player.queueSelectedGroup));
            }
          } else if (state.player.queueGrouping) {
            if (
              currentPlaylist?.id &&
              selectPlaylistConfigById(state, currentPlaylist.id).displayMode ==
                DisplayMode.SplitView
            ) {
              dispatch(
                updatePlaylistSplitViewState({
                  playlistId: currentPlaylist.id,
                  splitState: { selectedGroup: state.player.queueSelectedGroup }
                })
              );
            } else if (
              queueSource &&
              Object.values(LibraryView).includes(queueSource as LibraryView)
            ) {
              dispatch(
                updateLibrarySplitState({
                  view: queueSource,
                  splitState: { selectedGroup: state.player.queueSelectedGroup }
                })
              );
            }
          }
          if (currentPlaylist) {
            dispatch(
              push(BASEPATH + "playlist/" + currentPlaylist.id, {
                focusCurrent: true
              })
            );
          } else if (queueSource?.startsWith(View.Search)) {
            dispatch(setSearch(queueSource.split("/")[1]));
            dispatch(push(BASEPATH + "search/", { focusCurrent: true }));
          } else {
            dispatch(push(BASEPATH + queueSource, { focusCurrent: true }));
          }
        }
      }
      break;
    case "undo":
      if (state.undoable.past.length) {
        dispatch(ActionCreators.undo());
      }
      break;
    case "redo":
      if (state.undoable.future.length) {
        dispatch(ActionCreators.redo());
      }
      break;
    case "delete":
      {
        const visibleView = selectVisibleViewType(state);
        const visiblePlaylist = selectVisiblePlaylist(state)?.id;
        if (visiblePlaylist) {
          dispatch(
            removeTracksFromPlaylist({
              playlistId: visiblePlaylist,
              itemIds: state.tracks.selectedTracks.map((track) => track.itemId)
            })
          );
        } else if (visibleView == View.Queue) {
          dispatch(
            removeFromQueue(
              state.tracks.selectedTracks.map((track) => track.itemId)
            )
          );
        }
      }
      break;
    case "cut": {
      const visibleView = selectVisibleViewType(state);
      const visiblePlaylist = selectVisiblePlaylist(state)?.id;
      dispatch(copySelectedTracks());
      if (visiblePlaylist) {
        dispatch(
          removeTracksFromPlaylist({
            playlistId: visiblePlaylist,
            itemIds: state.tracks.selectedTracks.map((track) => track.itemId)
          })
        );
      } else if (visibleView == View.Queue) {
        dispatch(
          removeFromQueue(
            state.tracks.selectedTracks.map((track) => track.itemId)
          )
        );
      }
      break;
    }
    case "copy":
      dispatch(copySelectedTracks());
      break;
    case "paste":
      {
        const visiblePlaylist = selectVisiblePlaylist(state);
        if (visiblePlaylist?.id) {
          const newTracks: PlaylistItem[] = state.tracks.clipboard
            .map((node) => {
              return {
                itemId: nanoid(),
                trackId: node.trackId
              };
            })
            .filter(Boolean) as PlaylistItem[];
          dispatch(
            addTracksToPlaylist({
              playlistId: visiblePlaylist.id,
              newTracks
            })
          );
        }
      }
      break;
    case "togglePlaylistLayout": {
      const visiblePlaylist = selectVisiblePlaylist(state);
      if (visiblePlaylist?.id) {
        dispatch(
          togglePlaylistUsesCustomLayout({
            playlistId: visiblePlaylist.id,
            libraryColumnState: selectLibraryColumnState(state)
          })
        );
      }
      break;
    }
    default:
      break;
  }
  if (action.startsWith("columns.") && grid?.api) {
    const column = action.split(".")[1];
    const isVisible = grid?.api?.getColumn(column)?.isVisible();
    grid?.api.setColumnsVisible([column], !isVisible);
  }
  if (action.startsWith("groupBy.") && grid?.api) {
    const visiblePlaylist = selectVisiblePlaylist(state);
    if (visiblePlaylist?.id) {
      dispatch(
        updatePlaylistSplitViewState({
          playlistId: visiblePlaylist?.id,
          splitState: {
            trackGrouping: action.split(".")[1] as TrackGrouping
          }
        })
      );
    } else {
      const visibleLibraryView = selectVisibleViewType(state);
      const librarySplitState =
        selectLibrarySplitViewStates(state)[visibleLibraryView];
      if (librarySplitState && visibleLibraryView == LibraryView.Artists) {
        dispatch(
          updateLibrarySplitState({
            view: visibleLibraryView,
            splitState: {
              trackGrouping: action.split(".")[1] as TrackGrouping
            }
          })
        );
      }
    }
  }
  if (action.startsWith("viewType.")) {
    const visiblePlaylist = selectVisiblePlaylist(state);
    if (visiblePlaylist?.id) {
      dispatch(
        setPlaylistDisplayMode({
          playlistId: visiblePlaylist?.id,
          displayMode: action.split(".")[1] as DisplayMode
        })
      );
    }
  }
}

export const selectMenuState = createSelector(
  [
    (state: RootState) => state.config.language,
    (state: RootState) => state.router.location,
    (state: RootState) => state.undoable.present.library,
    (state: RootState) => state.undoable.present.playlists.layout,
    (state: RootState) => state.undoable.present.playlists.playlists,
    (state: RootState) => state.undoable.present.playlists.playlistsConfig,
    (state: RootState) => state.tracks.selectedTracks,
    (state: RootState) => state.tracks.clipboard,
    (state: RootState) => state.player.status,
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex,
    (state: RootState) => state.player.muted
  ],
  () => {
    const state = store.getState();
    let columnState = state.undoable.present.library.columnState;
    const playlistColumnState = selectVisiblePlaylistConfig(state)?.columnState;
    if (
      columnState &&
      playlistColumnState &&
      selectVisiblePlaylistConfig(state)?.useCustomLayout
    ) {
      columnState = columnState.map((existingColumn) => {
        const newColumn = playlistColumnState.find(
          (playlistColumn) => playlistColumn.colId === existingColumn.colId
        );
        return newColumn || existingColumn;
      });
    }
    const columnVisibility = {} as { [key: string]: MenuItemState };
    defaultColumnDefinitions?.forEach((c) => {
      if (c.field == "uri" || c.field == "trackId" || c.field == "attribution")
        return;
      const hidden = columnState?.find((col) => c.field == col.colId)?.hide;
      columnVisibility["columns." + c.field] = {
        selected: hidden != undefined ? !hidden : !c.hide,
        disabled: selectVisibleDisplayMode(state) != DisplayMode.TrackList
      };
    });
    Object.values(DisplayMode).forEach((displayMode) => {
      columnVisibility["viewType." + displayMode] = {
        selected:
          selectVisiblePlaylistConfig(state)?.displayMode == displayMode,
        disabled: !selectVisiblePlaylist(state)
      };
    });
    Object.values(TrackGrouping).forEach((grouping) => {
      const playlistSplitState =
        selectVisiblePlaylistConfig(state)?.splitViewState;
      const librarySplitState =
        selectLibrarySplitViewStates(state)[selectVisibleViewType(state)];
      columnVisibility["groupBy." + grouping] = {
        selected:
          (playlistSplitState?.trackGrouping ??
            librarySplitState?.trackGrouping) == grouping,
        disabled:
          !selectVisiblePlaylist(state) &&
          !(
            selectVisibleViewType(state) == LibraryView.Artists &&
            (grouping == TrackGrouping.AlbumArtist ||
              grouping == TrackGrouping.Artist)
          )
      };
    });

    // TODO: Should also be false if the visible list of tracks is empty
    const selectableTracksVisible =
      selectVisibleViewType(state) == View.Queue ||
      selectVisibleDisplayMode(state) == DisplayMode.TrackList ||
      ((selectVisibleDisplayMode(state) == DisplayMode.AlbumGrid ||
        selectVisibleDisplayMode(state) == DisplayMode.SplitView) &&
        selectVisibleSelectedTrackGroup(state) != null);

    const canDelete =
      (selectVisiblePlaylist(state) ||
        selectVisibleViewType(state) == View.Queue) &&
      selectableTracksVisible &&
      state.tracks.selectedTracks.length &&
      !(
        selectVisibleViewType(state) == View.Queue &&
        state.tracks.selectedTracks.find((track) => track.itemId)?.itemId ==
          selectCurrentTrackItemId(state)
      );

    return {
      back: {
        disabled: !(window.history.length > 1 && window.history.state.idx > 0)
      },
      forward: {
        disabled: !(
          window.history.length > 1 &&
          window.history.length - 1 != window.history.state.idx
        )
      },
      selectAll: {
        disabled:
          !selectableTracksVisible ||
          selectVisibleViewType(state) == View.Queue ||
          (selectVisibleDisplayMode(state) == DisplayMode.AlbumGrid &&
            !selectVisibleSelectedTrackGroup(state))
      },
      columns: {
        disabled: selectVisibleDisplayMode(state) != DisplayMode.TrackList
      },
      resetColumns: {
        disabled: selectVisibleDisplayMode(state) != DisplayMode.TrackList
      },
      groupBy: {
        disabled:
          selectVisibleDisplayMode(state) != DisplayMode.SplitView ||
          (!selectVisiblePlaylist(state) &&
            selectVisibleViewType(state) != LibraryView.Artists)
      },
      ...columnVisibility,
      togglePlay: {
        label:
          state.player.status == Status.Playing ||
          state.player.status == Status.Loading
            ? t("menu.togglePlay.pause")
            : t("menu.togglePlay.play"),
        disabled: state.player.status == Status.Stopped
      },
      next: {
        disabled: state.player.status == Status.Stopped
      },
      previous: {
        disabled: state.player.status == Status.Stopped
      },
      toggleMute: {
        label: state.player.muted
          ? t("menu.toggleMute.unmute")
          : t("menu.toggleMute.mute")
      },
      goToCurrent: {
        disabled: !state.player.currentTrack
      },
      undo: {
        label: getUndoActionLabel(),
        disabled: !state.undoable.past.length
      },
      redo: {
        label: getRedoActionLabel(),
        disabled: !state.undoable.future.length
      },
      delete: {
        disabled: !canDelete
      },
      cut: {
        disabled: !canDelete
      },
      copy: {
        disabled:
          !selectableTracksVisible || !state.tracks.selectedTracks.length
      },
      paste: {
        disabled:
          !selectVisiblePlaylist(state) || !state.tracks.clipboard.length
      },
      togglePlaylistLayout: {
        disabled: !selectVisiblePlaylist(state),
        selected: selectVisiblePlaylistConfig(state)?.useCustomLayout
      },
      viewType: {
        disabled: !selectVisiblePlaylist(state)
      }
    };
  }
);
