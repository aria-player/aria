import { AppDispatch, RootState, store } from "./store";
import { createSelector } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api";
import { push, goBack, goForward } from "redux-first-history";
import { BASEPATH } from "./constants";
import { AgGridReact } from "@ag-grid-community/react";
import { setColumnState } from "../features/library/librarySlice";
import { defaultColumnDefinitions } from "../features/library/libraryColumns";
import { Status } from "../features/player/playerTypes";
import {
  cycleRepeatMode,
  nextTrack,
  pause,
  resume,
  setMuted,
  setVolume,
  toggleShuffle
} from "../features/player/playerSlice";
import { restartOrPreviousTrack } from "../features/player/playerTime";
import { ActionCreators } from "redux-undo";
import { selectCurrentPlaylist } from "../features/sharedSelectors";
import { removeTracksFromPlaylist } from "../features/playlists/playlistsSlice";

export interface MenuItem {
  id: string;
  shortcut?: string;
  submenu?: MenuItem[];
  maconly?: boolean;
  winlinuxonly?: boolean;
  keepopen?: boolean;
}

export interface MenuItemState {
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
      dispatch(setColumnState([]));
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
        const currentPlaylist = selectCurrentPlaylist(store.getState())?.id;
        if (grid?.api && grid.api.getSelectedNodes() && currentPlaylist) {
          dispatch(
            removeTracksFromPlaylist({
              playlistId: currentPlaylist,
              trackIds: grid.api.getSelectedRows().map((node) => node.itemId)
            })
          );
        }
      }
      break;
    default:
      break;
  }
  if (action.startsWith("columns.") && grid?.columnApi) {
    const column = action.split(".")[1];
    const isVisible = grid?.columnApi?.getColumn(column)?.isVisible();
    grid?.columnApi.setColumnVisible(column, !isVisible);
  }
}

export const selectMenuState = createSelector(
  [
    (state: RootState) => state.router.location,
    (state: RootState) => state.undoable.present.library.columnState,
    (state: RootState) => state.undoable.present.library.layout,
    (state: RootState) => state.undoable.present.playlists.layout,
    (state: RootState) => state.undoable.present.playlists.playlists,
    (state: RootState) => state.player.status
  ],
  () => {
    const state = store.getState();
    const columnState = state.undoable.present.library.columnState;
    const columnVisibility = {} as { [key: string]: MenuItemState };
    if (columnState && columnState.length > 0) {
      columnState?.forEach((c) => {
        if (c.colId == "uri" || c.colId == "id") return;
        columnVisibility["columns." + c.colId] = {
          selected: !c.hide,
          disabled: state.router.location?.pathname != BASEPATH
        };
      });
    } else {
      defaultColumnDefinitions.forEach((c) => {
        if (c.field == "uri" || c.field == "id") return;
        columnVisibility["columns." + c.field] = {
          selected: !c.hide,
          disabled: state.router.location?.pathname != BASEPATH
        };
      });
    }

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
        disabled: state.router.location?.pathname != BASEPATH
      },
      columns: {
        disabled: state.router.location?.pathname != BASEPATH
      },
      ...columnVisibility,
      togglePlay: {
        disabled: state.player.status == Status.Stopped
      },
      next: {
        disabled: state.player.status == Status.Stopped
      },
      previous: {
        disabled: state.player.status == Status.Stopped
      },
      undo: {
        disabled: !state.undoable.past.length
      },
      redo: {
        disabled: !state.undoable.future.length
      },
      delete: {
        disabled: false // TODO: Playlist open && any item selected
      }
    };
  }
);
