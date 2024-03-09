import { createSelector } from "@reduxjs/toolkit";
import { RootState, store } from "../app/store";
import {
  selectQueueGrouping,
  selectQueueSelectedGroup
} from "./player/playerSlice";
import { selectPlaylistById } from "./playlists/playlistsSlice";
import { PlaylistItem } from "./playlists/playlistsTypes";
import { selectGroupFilteredTrackList } from "./genericSelectors";
import { selectTrackById } from "./tracks/tracksSlice";
import { TrackListItem } from "./tracks/tracksTypes";

export const selectCurrentQueueTracks = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex
  ],
  () => {
    const state = store.getState();
    const tracks = state.tracks.tracks;

    return state.player.queue
      .map((queueTrack) => ({
        ...tracks.entities[queueTrack.trackId],
        itemId: queueTrack.itemId
      }))
      .slice(state.player.queueIndex!);
  }
);

export const selectCurrentPlaylist = (state: RootState) => {
  if (!state.player.queueSource) return null;
  return selectPlaylistById(state, state.player.queueSource) ?? null;
};

export const selectCurrentTrack = createSelector(
  [
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex,
    (state: RootState) => state.tracks.tracks.entities
  ],
  () => {
    const state = store.getState();
    if (state.player.queueIndex == null) {
      return null;
    }
    const currentTrackId = state.player.queue[state.player.queueIndex];
    if (currentTrackId == null) {
      return null;
    }
    return {
      ...selectTrackById(state, currentTrackId.trackId),
      itemId: currentTrackId.itemId
    } as TrackListItem;
  }
);

export const selectCurrentTrackItemId = (state: RootState) => {
  if (state.player.queueIndex == null) {
    return null;
  }
  return state.player.queue[state.player.queueIndex].itemId;
};

export const selectCurrentGroupFilteredTrackList = (
  state: RootState
): PlaylistItem[] => {
  return selectGroupFilteredTrackList(
    state,
    selectQueueGrouping(state),
    selectQueueSelectedGroup(state),
    selectCurrentPlaylist(state)?.id
  );
};
