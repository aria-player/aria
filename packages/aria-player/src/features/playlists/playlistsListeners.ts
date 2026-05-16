import {
  MatchFunction,
  listenForAction,
  listenForChange,
} from "../../app/listener";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";

import { isAnyOf } from "@reduxjs/toolkit";
import {
  addTracksToPlaylist,
  cleanupPlaylistConfigs,
  deletePlaylistItem,
  selectPlaylistById,
  selectPlaylistsLayoutItemById,
} from "./playlistsSlice";
import { ActionTypes } from "redux-undo";
import { updateQueueAfterChange } from "../player/playerSlice";
import {
  selectCurrentPlaylist,
  selectCurrentGroupFilteredTrackList,
} from "../currentSelectors";
import { selectSortedTrackList } from "../genericSelectors";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
} from "../visibleSelectors";
import { View } from "../../app/view";
import { showToast } from "../../app/toasts";
import { selectTrackById } from "../tracks/tracksSlice";
import { t } from "i18next";
import { selectCachedPlaylistTrackUris } from "../cache/cacheSlice";
import { getTrackId } from "../../app/utils";

function buildExternalPlaylistQueue(
  playlistId: string,
  provider: string,
  uris: (string | null)[]
) {
  return uris.flatMap((uri, i) => {
    if (uri === null) return [];
    return [
      { itemId: `${playlistId}:${i}`, trackId: getTrackId(provider, uri) },
    ];
  });
}

export function setupPlaylistsListeners() {
  listenForAction(isAnyOf(addTracksToPlaylist), (state, action) => {
    const payload = (action as ReturnType<typeof addTracksToPlaylist>).payload;
    const playlistName = selectPlaylistsLayoutItemById(
      state,
      payload.playlistId
    )?.name;
    if (payload.newTracks.length === 1) {
      const track = selectTrackById(state, payload.newTracks[0].trackId);
      showToast(
        t("toasts.addedNamedTrackToPlaylist", {
          title: track?.title,
          playlist: playlistName,
        })
      );
    } else {
      showToast(
        t("toasts.addedTracksToPlaylist", {
          count: payload.newTracks.length,
          playlist: playlistName,
        })
      );
    }
  });

  listenForAction(
    isAnyOf(
      deletePlaylistItem,
      ((action) =>
        // Check after undo in case createPlaylist is undone with playlist open
        action.type === ActionTypes.UNDO ||
        // Check after redo in case deletePlaylist is redone with playlist open
        action.type === ActionTypes.REDO) as MatchFunction
    ),
    (state, _, dispatch) => {
      if (
        !selectVisiblePlaylist(state) &&
        selectVisibleViewType(state) == View.Playlist
      ) {
        dispatch(push(BASEPATH + "songs"));
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
      const playlistEntity = selectPlaylistById(state, newPlaylist.id);
      const cachedUris = playlistEntity?.provider
        ? selectCachedPlaylistTrackUris(state, newPlaylist.id)
        : null;
      const newQueue = cachedUris
        ? buildExternalPlaylistQueue(
            newPlaylist.id,
            playlistEntity!.provider!,
            cachedUris.uris
          )
        : state.player.queueGrouping
          ? selectCurrentGroupFilteredTrackList(state)
          : selectSortedTrackList(state, View.Playlist, newPlaylist?.id);
      dispatch(updateQueueAfterChange(newQueue));
    }
  );

  listenForChange(
    (state) => {
      const playlist = selectCurrentPlaylist(state);
      if (!playlist?.provider) return null;
      return selectCachedPlaylistTrackUris(state, playlist.id);
    },
    (state, _, dispatch) => {
      const currentPlaylist = selectCurrentPlaylist(state);
      if (!currentPlaylist?.provider) return;
      const cachedUris = selectCachedPlaylistTrackUris(
        state,
        currentPlaylist.id
      );
      if (!cachedUris) return;
      const playlistEntity = selectPlaylistById(state, currentPlaylist.id);
      if (!playlistEntity?.provider) return;
      dispatch(
        updateQueueAfterChange(
          buildExternalPlaylistQueue(
            currentPlaylist.id,
            playlistEntity.provider,
            cachedUris.uris
          )
        )
      );
    }
  );

  listenForChange(
    (state) => state.undoable.present.playlists._persist?.rehydrated,
    (state, _, dispatch) => {
      const deletedIds =
        state.undoable.present.playlists.playlistsConfig.ids.filter(
          (configId) =>
            !state.undoable.present.playlists.playlists.entities[configId]
        );

      if (deletedIds.length > 0) {
        dispatch(cleanupPlaylistConfigs({ deletedIds }));
      }
    }
  );
}
