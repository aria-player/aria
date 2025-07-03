import { Reducer } from "react";
import { Action } from "redux";
import {
  moveLibraryItem,
  resetLibraryLayout,
  updateLibraryItem
} from "../features/library/librarySlice";
import {
  addTracksToPlaylist,
  createPlaylistItem,
  deletePlaylistItem,
  movePlaylistItem,
  removeTracksFromPlaylist,
  setPlaylistTracks,
  updatePlaylistItem
} from "../features/playlists/playlistsSlice";
import { UndoableSlices } from "./store";
import { ActionTypes } from "redux-undo";
import { t } from "i18next";

const pastActions: Action[] = [];
const futureActions: Action[] = [];

export const undoableActions = [
  moveLibraryItem,
  updateLibraryItem,
  resetLibraryLayout,

  movePlaylistItem,
  updatePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem,
  addTracksToPlaylist,
  removeTracksFromPlaylist,
  setPlaylistTracks
];

export const undoableActionTypes: string[] = undoableActions.map(
  (action) => action.type
);

export const excludeStateFromUndo =
  (reducer: Reducer<UndoableSlices, Action>) =>
  (state: UndoableSlices, action: Action) => {
    switch (action.type) {
      case ActionTypes.UNDO:
      case ActionTypes.REDO: {
        const newState = reducer(state, action);
        return {
          ...newState,
          present: {
            ...newState.present,
            library: {
              ...newState.present.library,
              columnState: state.present.library.columnState,
              selectedAlbum: state.present.library.selectedAlbum,
              splitViewStates: state.present.library.splitViewStates
            },
            playlists: {
              ...newState.present.playlists,
              playlistsConfig: state.present.playlists.playlistsConfig,
              foldersOpen: state.present.playlists.openFolders
            }
          }
        };
      }
      default:
        return reducer(state, action);
    }
  };

export const recordUndoableActions =
  (reducer: Reducer<UndoableSlices, Action>) =>
  (state: UndoableSlices, action: Action) => {
    if (action.type === ActionTypes.UNDO) {
      const undoAction = pastActions.pop();
      if (undoAction) {
        futureActions.unshift(undoAction);
      }
    } else if (action.type === ActionTypes.REDO) {
      const redoAction = futureActions.shift();
      if (redoAction) {
        pastActions.push(redoAction);
      }
    } else if (undoableActionTypes.includes(action.type)) {
      pastActions.push(action);
      futureActions.length = 0;
    }
    return reducer(state, action);
  };

export function getRedoActionLabel(): string {
  const nextAction = futureActions[0];
  const actionLabel = nextAction && getActionLabel(nextAction);
  return actionLabel
    ? t("actions.redoAction", { action: actionLabel })
    : t("menu.redo");
}

export function getUndoActionLabel(): string {
  const lastAction = pastActions[pastActions.length - 1];
  const actionLabel = lastAction && getActionLabel(lastAction);
  return actionLabel
    ? t("actions.undoAction", { action: actionLabel })
    : t("menu.undo");
}

function getActionLabel(action: Action): string | undefined {
  // TODO: Detect whether playlist items are playlists or folders
  switch (action.type) {
    case "library/moveLibraryItem":
      return t("actions.moveLibraryItem");
    case "library/updateLibraryItem":
      return (action as ReturnType<typeof updatePlaylistItem>).payload.changes
        .hidden
        ? t("actions.hideLibraryItem")
        : t("actions.showLibraryItem");
    case "library/resetLibraryLayout":
      return t("actions.resetLibraryLayout");
    case "playlists/movePlaylistItem":
      return t("actions.movePlaylistItem");
    case "playlists/updatePlaylistItem":
      return t("actions.renamePlaylistItem");
    case "playlists/createPlaylistItem":
      return t("actions.createPlaylistItem");
    case "playlists/deletePlaylistItem":
      return t("actions.deletePlaylistItem");
    case "playlists/addTracksToPlaylist":
      return t("actions.addToPlaylist", {
        count: (action as ReturnType<typeof addTracksToPlaylist>).payload
          .newTracks.length
      });
    case "playlists/removeTracksFromPlaylist":
      return t("actions.removeFromPlaylist", {
        count: (action as ReturnType<typeof removeTracksFromPlaylist>).payload
          .itemIds.length
      });
    case "playlists/setPlaylistTracks":
      return t("actions.reorderPlaylist");
    default:
      return undefined;
  }
}
