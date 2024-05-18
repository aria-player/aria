import { createSelector } from "@reduxjs/toolkit";
import { RootState, store } from "../app/store";
import {
  selectQueueGrouping,
  selectQueueSelectedGroup
} from "./player/playerSlice";
import { selectPlaylistById } from "./playlists/playlistsSlice";
import { PlaylistItem } from "./playlists/playlistsTypes";
import { selectTrackById } from "./tracks/tracksSlice";
import { TrackListItem } from "./tracks/tracksTypes";
import { selectGroupFilteredTracks } from "./genericSelectors";

export const selectCurrentQueueTracks = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex,
    (state: RootState) => state.player.upNext
  ],
  () => {
    const state = store.getState();
    const tracks = state.tracks.tracks;

    const queue = state.player.queue
      .map((queueTrack) => ({
        ...tracks.entities[queueTrack.trackId],
        itemId: queueTrack.itemId
      }))
      .slice(state.player.queueIndex!);

    const upNext = state.player.upNext.map((queueTrack) => ({
      ...tracks.entities[queueTrack.trackId],
      itemId: queueTrack.itemId
    }));

    const queueWithSeparators = [
      { itemId: "currentTrackSeparator", separator: true },
      ...queue.slice(0, 1),
      ...(upNext.length > 0
        ? [{ itemId: "upNextSeparator", separator: true }, ...upNext]
        : []),
      ...(queue.slice(1).length > 0
        ? [
            { itemId: "playingSourceSeparator", separator: true },
            ...queue.slice(1)
          ]
        : [])
    ];

    return queueWithSeparators;
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
  return selectGroupFilteredTracks(
    state,
    selectQueueGrouping(state),
    selectQueueSelectedGroup(state),
    selectCurrentPlaylist(state)?.id
  ).map((track) => ({
    itemId: track.itemId,
    trackId: track.trackId
  }));
};
