import { RootState, store } from "../app/store";
import { selectTrackById } from "./tracks/tracksSlice";
import { selectPlaylistById } from "./playlists/playlistsSlice";
import { createSelector } from "@reduxjs/toolkit";
import { BASEPATH } from "../app/constants";

export const selectCurrentTrack = (state: RootState) => {
  if (state.player.queueIndex == null) {
    return null;
  }
  const currentTrackId = state.player.queue[state.player.queueIndex];
  if (currentTrackId == null) {
    return null;
  }
  return selectTrackById(state, currentTrackId);
};

export const selectVisiblePlaylist = (state: RootState) => {
  if (state.router.location?.pathname.split("/")[2] != null)
    return selectPlaylistById(
      state,
      state.router.location?.pathname.split("/")[2]
    );
};

export const selectVisibleTracks = createSelector(
  [
    (state: RootState) => state.tracks,
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists
  ],
  () => {
    const state = store.getState();
    const tracks = state.tracks.tracks;
    const isQueue = state.router.location?.pathname.split("/")[1] == "queue";
    const visiblePlaylist = selectVisiblePlaylist(state)?.tracks;
    return visiblePlaylist
      ? visiblePlaylist.map((playlistTrack) => {
          return {
            ...playlistTrack,
            ...tracks.entities[playlistTrack.trackId]
          };
        })
      : isQueue
        ? state.player.queue.map((trackId) => ({
            ...tracks.entities[trackId],
            itemId: trackId
          }))
        : Object.values(tracks.entities).map((track) => ({
            itemId: track?.id,
            ...track
          }));
  }
);

export const selectTrackListIsVisible = (state: RootState) => {
  return (
    state.router.location?.pathname == BASEPATH ||
    state.router.location?.pathname.split("/")[1] == "queue" ||
    selectVisiblePlaylist(state)?.id != null
  );
};
