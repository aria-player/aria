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
              selectedItem: state.present.library.selectedAlbum,
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
