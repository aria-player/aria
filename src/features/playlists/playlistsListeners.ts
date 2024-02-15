import { listenForAction, listenForChange } from "../../app/listener";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import {
  selectCurrentPlaylist,
  selectVisiblePlaylist
} from "../sharedSelectors";
import { AnyAction, isAnyOf } from "@reduxjs/toolkit";
import { deletePlaylistItem } from "./playlistsSlice";
import { ActionTypes } from "redux-undo";
import { MatchFunction } from "@reduxjs/toolkit/dist/listenerMiddleware/types";
import { updateQueueAfterChange } from "../player/playerSlice";

export function setupPlaylistsListeners() {
  listenForAction(
    isAnyOf(
      deletePlaylistItem,
      ((action) =>
        // Check after undo in case createPlaylist is undone with playlist open
        action.type === ActionTypes.UNDO ||
        // Check after redo in case deletePlaylist is redone with playlist open
        action.type === ActionTypes.REDO) as MatchFunction<AnyAction>
    ),
    (state, _, dispatch) => {
      if (!selectVisiblePlaylist(state)) {
        dispatch(push(BASEPATH));
      }
    }
  );

  listenForChange(
    (state) => selectCurrentPlaylist(state),
    (state, _, dispatch) => {
      const newPlaylist = selectCurrentPlaylist(state);
      if (!newPlaylist) {
        // Either there's no playlist playing or the current playlist was deleted
        // If it was deleted, the player should keep playing what it remembers of it
        return;
      }
      dispatch(
        // TODO: Currently this doesn't account for the playlist sort order, so it will be forgotten
        // after any tracks are added/removed from the playlist
        updateQueueAfterChange(newPlaylist.tracks)
      );
    }
  );
}
