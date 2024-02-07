import { listenForAction } from "../../app/listener";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { selectCurrentPlaylist } from "../sharedSelectors";
import { AnyAction, isAnyOf } from "@reduxjs/toolkit";
import { deletePlaylistItem } from "./playlistsSlice";
import { ActionTypes } from "redux-undo";
import { MatchFunction } from "@reduxjs/toolkit/dist/listenerMiddleware/types";

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
      if (!selectCurrentPlaylist(state)) {
        dispatch(push(BASEPATH));
      }
    }
  );
}
