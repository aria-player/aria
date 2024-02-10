import { RootState, store } from "../app/store";
import { selectTrackById } from "./tracks/tracksSlice";
import { selectPlaylistById } from "./playlists/playlistsSlice";
import { createSelector } from "@reduxjs/toolkit";
import { TrackListItem } from "./tracks/tracksTypes";
import { LibraryView, View, isLibraryView } from "../app/view";

export const selectVisibleViewType = (state: RootState) => {
  const firstPath = state.router.location?.pathname.split("/")[1];
  if (!firstPath) {
    return LibraryView.Songs;
  } else if (isLibraryView(firstPath)) {
    return firstPath as LibraryView;
  } else if (Object.values(View).includes(firstPath as View)) {
    return firstPath as View;
  }
  return View.Error;
};

export const selectCurrentTrack = (state: RootState) => {
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
};

export const selectCurrentTrackItemId = (state: RootState) => {
  if (state.player.queueIndex == null) {
    return null;
  }
  return state.player.queue[state.player.queueIndex].itemId;
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
    (state: RootState) => state.undoable.present.playlists,
    (state: RootState) => state.player.queue,
    (state: RootState) => state.player.queueIndex
  ],
  () => {
    const state = store.getState();
    const tracks = state.tracks.tracks;
    const visiblePlaylist = selectVisiblePlaylist(state)?.tracks;
    return visiblePlaylist
      ? visiblePlaylist.map((playlistTrack) => {
          return {
            ...playlistTrack,
            ...tracks.entities[playlistTrack.trackId]
          };
        })
      : selectVisibleViewType(state) === View.Queue
        ? state.player.queue
            .map((trackId) => ({
              ...tracks.entities[trackId.trackId],
              itemId: trackId.itemId
            }))
            .slice(state.player.queueIndex!)
        : (Object.values(tracks.entities).map((track) => ({
            ...track,
            itemId: track?.trackId
          })) as TrackListItem[]);
  }
);

export const selectTrackListIsVisible = (state: RootState) => {
  return (
    selectVisibleViewType(state) === LibraryView.Songs ||
    selectVisibleViewType(state) === View.Queue ||
    selectVisiblePlaylist(state) != null
  );
};
