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
import { RepeatMode } from "./player/playerTypes";
import { View } from "../app/view";

export const selectCurrentQueueTracks = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.player.currentTrack,
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex,
    (state: RootState) => state.player.upNext
  ],
  () => {
    const state = store.getState();
    if (!state.player.currentTrack) return [];
    const tracks = state.tracks.tracks;

    const currentTrack = {
      ...tracks.entities[state.player.currentTrack.trackId],
      itemId: state.player.currentTrack.itemId
    };

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
      currentTrack,
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

export const selectNextTrack = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex,
    (state: RootState) => state.player.upNext,
    (state: RootState) => state.player.repeatMode
  ],
  () => {
    const state = store.getState();
    if (state.player.queueIndex == null) return null;
    if (state.player.repeatMode == RepeatMode.One) {
      return selectCurrentTrack(state);
    }
    const isAtEndOfQueue =
      state.player.queueIndex === state.player.queue.length - 1;
    const nextTrackId =
      state.player.upNext[0]?.trackId ??
      (isAtEndOfQueue && state.player.repeatMode === RepeatMode.All
        ? state.player.queue[0]?.trackId
        : state.player.queue[state.player.queueIndex + 1]?.trackId);
    return nextTrackId ? selectTrackById(state, nextTrackId) : null;
  }
);

export const selectCurrentPlaylist = (state: RootState) => {
  if (!state.player.queueSource) return null;
  const playlistId = state.player.queueSource?.startsWith(View.Playlist)
    ? decodeURIComponent(state.player.queueSource.split("/")[1])
    : null;
  if (!playlistId) return null;
  return selectPlaylistById(state, playlistId) ?? null;
};

export const selectCurrentTrack = createSelector(
  [
    (state: RootState) => state.player.currentTrack,
    (state: RootState) => state.tracks.tracks.entities
  ],
  () => {
    const state = store.getState();
    const currentTrack = state.player.currentTrack;
    if (currentTrack == null) {
      return null;
    }
    return {
      ...selectTrackById(state, currentTrack.trackId),
      itemId: currentTrack.itemId
    } as TrackListItem;
  }
);

export const selectCurrentTrackItemId = (state: RootState) => {
  return state.player.currentTrack?.itemId;
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
