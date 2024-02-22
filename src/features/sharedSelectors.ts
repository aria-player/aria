import { RootState, store } from "../app/store";
import { selectTrackById } from "./tracks/tracksSlice";
import {
  selectPlaylistById,
  selectPlaylistConfigById
} from "./playlists/playlistsSlice";
import { createSelector } from "@reduxjs/toolkit";
import { TrackListItem } from "./tracks/tracksTypes";
import { LibraryView, View, DisplayMode, isLibraryView } from "../app/view";
import { PlaylistId, PlaylistItem } from "./playlists/playlistsTypes";
import { selectLibraryColumnState } from "./library/librarySlice";
import { compareMetadata, overrideColumnStateSort } from "../app/utils";

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

export const selectVisiblePlaylist = (state: RootState) => {
  if (state.router.location?.pathname.split("/")[2] != null)
    return selectPlaylistById(
      state,
      state.router.location?.pathname.split("/")[2]
    );
};

export const selectVisiblePlaylistConfig = (state: RootState) => {
  if (state.router.location?.pathname.split("/")[2] != null)
    return (
      selectPlaylistConfigById(
        state,
        state.router.location?.pathname.split("/")[2]
      ) ?? null
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
            .map((queueTrack) => ({
              ...tracks.entities[queueTrack.trackId],
              itemId: queueTrack.itemId
            }))
            .slice(state.player.queueIndex!)
        : (Object.values(tracks.entities).map((track) => ({
            ...track,
            itemId: track?.trackId
          })) as TrackListItem[]);
  }
);

export const selectSortedTrackList = (
  state: RootState,
  playlistId?: PlaylistId
): PlaylistItem[] => {
  // 1. Get tracks with metadata
  const playlist = playlistId
    ? selectPlaylistById(state, playlistId)
    : undefined;
  const tracks = playlist
    ? playlist.tracks.map((track) => ({
        ...track,
        ...state.tracks.tracks.entities[track.trackId]
      }))
    : (Object.values(state.tracks.tracks.entities).map((track) => ({
        ...track,
        itemId: track?.trackId
      })) as TrackListItem[]);

  // 2. Get the column state that applies to this playlist
  const playlistConfig = playlistId
    ? selectPlaylistConfigById(state, playlistId)
    : undefined;
  const libraryColumnState = selectLibraryColumnState(state);
  const columnState = playlistConfig?.useCustomLayout
    ? playlistConfig.columnState
    : playlistConfig && libraryColumnState
      ? overrideColumnStateSort(libraryColumnState, playlistConfig.columnState)
      : libraryColumnState;
  // Don't sort by any hidden columns
  const filteredColumnState = columnState?.filter((col) => !col.hide);

  const tracksCopy = tracks.slice();
  if (filteredColumnState && filteredColumnState.length > 0) {
    // 3. Determine the sorted column state
    const sortedColumnState = filteredColumnState
      .filter((col) => col.sort !== null)
      .sort((a, b) => (a.sortIndex ?? 0) - (b.sortIndex ?? 0));

    // 4. Finally, sort the tracks
    tracksCopy.sort((a, b) => {
      for (const col of sortedColumnState) {
        const keyA = a[col.colId as keyof TrackListItem];
        const keyB = b[col.colId as keyof TrackListItem];
        const comparisonResult = compareMetadata(
          keyA,
          keyB,
          col.sort === "desc"
        );
        if (comparisonResult !== 0) {
          return comparisonResult;
        }
      }
      return 0;
    });
  }
  return tracksCopy.map((track) => ({
    itemId: track.itemId,
    trackId: track.trackId
  }));
};

export const selectTrackListIsVisible = (state: RootState) => {
  return (
    selectVisibleViewType(state) === LibraryView.Songs ||
    selectVisibleViewType(state) === View.Queue ||
    (selectVisiblePlaylist(state) != null &&
      selectVisiblePlaylistConfig(state)?.displayMode == DisplayMode.TrackList)
  );
};

export const selectDebugViewIsVisible = (state: RootState) => {
  return (
    selectVisiblePlaylist(state) != null &&
    selectVisiblePlaylistConfig(state)?.displayMode == DisplayMode.DebugView
  );
};

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
