import { createSelector } from "@reduxjs/toolkit";
import { RootState, store } from "../app/store";
import {
  LibraryView,
  isLibraryView,
  View,
  DisplayMode,
  TrackGrouping
} from "../app/view";
import { selectLibrarySplitViewStates } from "./library/librarySlice";
import {
  selectPlaylistById,
  selectPlaylistConfigById
} from "./playlists/playlistsSlice";
import { PlaylistItem } from "./playlists/playlistsTypes";
import { selectGroupFilteredTracks } from "./genericSelectors";
import { TrackListItem } from "./tracks/tracksTypes";
import { searchTracks } from "../app/search";
import { selectSearch } from "./search/searchSlice";

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
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.search.search,
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists.playlists
  ],
  () => {
    const state = store.getState();
    const tracks = state.tracks.tracks;
    const visiblePlaylist = selectVisiblePlaylist(state)?.tracks;
    const search = selectSearch(state);
    return visiblePlaylist
      ? visiblePlaylist.map((playlistTrack) => {
          return {
            ...playlistTrack,
            ...tracks.entities[playlistTrack.trackId]
          };
        })
      : Object.values(LibraryView).includes(
            selectVisibleViewType(state) as LibraryView
          )
        ? (Object.values(tracks.entities).map((track) => ({
            ...track,
            itemId: track?.trackId
          })) as TrackListItem[])
        : selectVisibleViewType(state) == View.Search
          ? (searchTracks(Object.values(tracks.entities), search).map(
              (track) => ({
                ...track,
                itemId: track?.trackId
              })
            ) as TrackListItem[])
          : [];
  }
);

export const selectVisibleGroupFilteredTracks = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.library.splitViewStates,
    (state: RootState) => state.undoable.present.library.selectedAlbum,
    (state: RootState) => state.undoable.present.playlists.playlists,
    (state: RootState) => state.undoable.present.playlists.playlistsConfig
  ],
  () => {
    const state = store.getState();
    return selectGroupFilteredTracks(
      state,
      selectVisibleTrackGrouping(state),
      selectVisibleSelectedTrackGroup(state),
      selectVisiblePlaylist(state)?.id
    );
  }
);

export const selectVisibleGroupFilteredTrackList = (
  state: RootState
): PlaylistItem[] => {
  return selectGroupFilteredTracks(
    state,
    selectVisibleTrackGrouping(state),
    selectVisibleSelectedTrackGroup(state),
    selectVisiblePlaylist(state)?.id
  ).map((track) => ({
    itemId: track.itemId,
    trackId: track.trackId
  }));
};

export const selectVisibleDisplayMode = (state: RootState) => {
  if (
    selectVisibleViewType(state) === LibraryView.Songs ||
    (selectVisibleViewType(state) === View.Search && selectSearch(state) != "")
  )
    return DisplayMode.TrackList;

  if (selectVisibleViewType(state) === LibraryView.Albums)
    return DisplayMode.AlbumGrid;

  if (
    [
      LibraryView.Artists,
      LibraryView.Genres,
      LibraryView.Composers,
      LibraryView.Years
    ].includes(selectVisibleViewType(state) as LibraryView)
  ) {
    return DisplayMode.SplitView;
  }

  return (
    selectVisiblePlaylist(state) != null &&
    selectVisiblePlaylistConfig(state)?.displayMode
  );
};

export const selectVisibleTrackGrouping = (state: RootState) => {
  if (selectVisibleDisplayMode(state) === DisplayMode.AlbumGrid)
    return TrackGrouping.Album;

  if (selectVisibleDisplayMode(state) == DisplayMode.SplitView) {
    const playlistGrouping =
      selectVisiblePlaylistConfig(state)?.splitViewState.trackGrouping;
    return playlistGrouping
      ? playlistGrouping
      : selectLibrarySplitViewStates(state)[selectVisibleViewType(state)]
          .trackGrouping;
  }
};

export const selectVisibleSelectedTrackGroup = (state: RootState) => {
  if (selectVisibleViewType(state) == LibraryView.Albums) {
    return state.undoable.present.library.selectedAlbum;
  } else if (selectVisiblePlaylist(state)) {
    const playlistConfig = selectVisiblePlaylistConfig(state);
    if (playlistConfig?.displayMode == DisplayMode.AlbumGrid) {
      return playlistConfig.selectedAlbum;
    } else {
      return playlistConfig?.splitViewState.selectedGroup;
    }
  } else {
    return selectLibrarySplitViewStates(state)[selectVisibleViewType(state)]
      ?.selectedGroup;
  }
};

export const selectVisibleTrackGroups = createSelector(
  [
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists,
    (state: RootState) => state.undoable.present.library,
    (state: RootState) => state.tracks.tracks
  ],
  () => {
    const state = store.getState();
    if (selectVisibleDisplayMode(state) == DisplayMode.AlbumGrid) {
      return [
        ...new Set(selectVisibleTracks(state).map((track) => track.album))
      ];
    } else if (selectVisibleDisplayMode(state) == DisplayMode.SplitView) {
      const grouping = selectVisiblePlaylist(state)
        ? selectVisiblePlaylistConfig(state)?.splitViewState.trackGrouping
        : selectLibrarySplitViewStates(state)[
            selectVisibleViewType(state) as string
          ].trackGrouping;
      if (grouping) {
        return [
          ...new Set(
            selectVisibleTracks(state)
              .flatMap((track) => track[grouping] as string | string[])
              .filter(
                (group) => group !== null && group !== undefined && group != ""
              )
          )
        ];
      }
    }
    return [];
  }
);
