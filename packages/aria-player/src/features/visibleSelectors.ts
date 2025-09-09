import { createSelector } from "@reduxjs/toolkit";
import { RootState, store } from "../app/store";
import {
  LibraryView,
  isLibraryView,
  View,
  DisplayMode,
  TrackGrouping,
  SettingsSection,
  SearchCategory
} from "../app/view";
import { selectLibrarySplitViewStates } from "./library/librarySlice";
import {
  selectPlaylistById,
  selectPlaylistConfigById
} from "./playlists/playlistsSlice";
import { PlaylistItem } from "./playlists/playlistsTypes";
import { selectGroupFilteredTracks } from "./genericSelectors";
import { TrackListItem } from "./tracks/tracksTypes";
import { Track } from "../../../types/tracks";
import {
  selectAllTracks,
  selectAllAlbums,
  selectAllArtists
} from "./tracks/tracksSlice";
import {
  searchTracks,
  searchArtists,
  searchAlbums,
  searchAllCategories
} from "../app/search";
import { selectSearch } from "./search/searchSlice";
import { BASEPATH } from "../app/constants";

export const selectVisibleViewType = (state: RootState) => {
  const path = state.router.location?.pathname
    .substring(BASEPATH.length)
    .replace(/\/$/, "");
  if (!path) {
    return LibraryView.Songs;
  }
  const firstPath = path.split("/")[0];
  if (isLibraryView(firstPath)) {
    return firstPath as LibraryView;
  } else if (Object.values(View).includes(firstPath as View)) {
    return firstPath as View;
  }
  return View.Error;
};

export const selectVisibleSettingsSection = (state: RootState) => {
  if (selectVisibleViewType(state) == View.Settings) {
    const secondPath = state.router.location?.pathname
      .substring(BASEPATH.length)
      .split("/")[1];
    if (!secondPath) {
      return SettingsSection.General;
    } else if (
      Object.values(SettingsSection).includes(secondPath as SettingsSection)
    ) {
      return secondPath as SettingsSection;
    }
  }
};

export const selectVisibleSearchCategory = (state: RootState) => {
  if (selectVisibleViewType(state) == View.Search) {
    const thirdPath = state.router.location?.pathname
      .substring(BASEPATH.length)
      .split("/")[2];
    if (!thirdPath) {
      return null;
    } else if (
      Object.values(SearchCategory).includes(thirdPath as SearchCategory)
    ) {
      return thirdPath as SearchCategory;
    }
  }
};

export const selectVisiblePlaylist = (state: RootState) => {
  const pathParts = state.router.location?.pathname
    .substring(BASEPATH.length)
    .split("/");
  if (pathParts && pathParts.length > 1 && pathParts[0] === View.Playlist) {
    return selectPlaylistById(state, pathParts[1]);
  }
};

export const selectVisiblePlaylistConfig = (state: RootState) => {
  const pathParts = state.router.location?.pathname
    .substring(BASEPATH.length)
    .split("/");
  if (pathParts && pathParts.length > 1 && pathParts[0] === View.Playlist) {
    return selectPlaylistConfigById(state, pathParts[1]);
  }
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
    const tracksById = state.tracks.tracks.entities;
    const visiblePlaylist = selectVisiblePlaylist(state)?.tracks;
    const visibleViewType = selectVisibleViewType(state);
    const search = selectSearch(state);
    return visiblePlaylist
      ? visiblePlaylist.map((playlistTrack) => {
          return {
            ...playlistTrack,
            ...tracksById[playlistTrack.trackId]
          };
        })
      : Object.values(LibraryView).includes(
            selectVisibleViewType(state) as LibraryView
          )
        ? (selectAllTracks(state).map((track) => ({
            ...track,
            itemId: visibleViewType + "/" + track?.trackId
          })) as TrackListItem[])
        : selectVisibleViewType(state) == View.Search
          ? (searchTracks(selectAllTracks(state), search).map((track) => ({
              ...track,
              itemId: search + "/" + track?.trackId
            })) as TrackListItem[])
          : [];
  }
);

export const selectVisibleGroupFilteredTracks = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.library.splitViewStates,
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
    (selectVisibleViewType(state) === View.Search &&
      selectVisibleSearchCategory(state) == SearchCategory.Songs &&
      selectSearch(state) != "")
  )
    return DisplayMode.TrackList;
  if (
    selectVisibleViewType(state) === LibraryView.Albums ||
    selectVisibleSearchCategory(state) == SearchCategory.Albums
  )
    return DisplayMode.AlbumGrid;

  if (
    [
      LibraryView.Artists,
      LibraryView.Genres,
      LibraryView.Composers,
      LibraryView.Years,
      LibraryView.Folders
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
    return TrackGrouping.AlbumId;
  if (selectVisibleSearchCategory(state) == SearchCategory.Artists) {
    return selectLibrarySplitViewStates(state)[LibraryView.Artists]
      .trackGrouping;
  }
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
  const pathSegments = state.router.location?.pathname
    .substring(BASEPATH.length)
    .replace(/\/$/, "")
    .split("/");
  if (!pathSegments || pathSegments.length < 2) {
    return null;
  }
  const firstPath = pathSegments[0];
  const secondPath = pathSegments[1];
  if (firstPath === View.Playlist && pathSegments.length >= 3) {
    return decodeURIComponent(pathSegments[2]);
  }

  if (isLibraryView(firstPath)) {
    return secondPath ? decodeURIComponent(secondPath) : null;
  }

  return null;
};

export const selectVisibleTrackGroups = createSelector(
  [
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists,
    (state: RootState) => state.undoable.present.library,
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.search.search
  ],
  () => {
    const state = store.getState();
    if (selectVisibleDisplayMode(state) == DisplayMode.AlbumGrid) {
      const search = selectSearch(state);
      if (selectVisibleSearchCategory(state) == SearchCategory.Albums) {
        return searchAlbums(selectAllAlbums(state), search).map(
          (album) => album.albumId
        );
      } else {
        return [
          ...new Set(selectVisibleTracks(state).map((track) => track.albumId))
        ];
      }
    } else if (
      selectVisibleDisplayMode(state) == DisplayMode.SplitView ||
      selectVisibleSearchCategory(state) == SearchCategory.Artists
    ) {
      const grouping = selectVisiblePlaylist(state)
        ? selectVisiblePlaylistConfig(state)?.splitViewState.trackGrouping
        : selectVisibleSearchCategory(state) == SearchCategory.Artists
          ? selectLibrarySplitViewStates(state)[LibraryView.Artists]
              .trackGrouping
          : selectLibrarySplitViewStates(state)[
              selectVisibleViewType(state) as string
            ].trackGrouping;
      if (grouping) {
        if (selectVisibleSearchCategory(state) == SearchCategory.Artists) {
          const search = selectSearch(state);
          return searchArtists(selectAllArtists(state), search).map(
            (group) => group.artist
          );
        } else {
          return [
            ...new Set(
              selectVisibleTracks(state)
                .flatMap((track) => track[grouping] as string | string[])
                .filter(
                  (group) =>
                    group !== null && group !== undefined && group != ""
                )
            )
          ];
        }
      }
    }
    return [];
  }
);

export const selectVisibleAlbums = createSelector(
  [
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists,
    (state: RootState) => state.undoable.present.library,
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.search.search
  ],
  () => {
    const state = store.getState();
    const allAlbums = selectAllAlbums(state);
    const search = selectSearch(state);
    if (search && selectVisibleViewType(state) == View.Search) {
      return searchAlbums(allAlbums, search);
    } else {
      return allAlbums
        .filter((album) =>
          selectVisibleTrackGroups(state).includes(album.albumId)
        )
        .sort(
          (a, b) =>
            a.album?.localeCompare(b.album!, undefined, {
              sensitivity: "base",
              ignorePunctuation: true
            }) ?? 0
        );
    }
  }
);

export const selectVisibleArtists = createSelector(
  [
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists,
    (state: RootState) => state.undoable.present.library,
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.search.search
  ],
  () => {
    const state = store.getState();
    const allArtists = selectAllArtists(state);
    const search = selectSearch(state);
    if (search && selectVisibleViewType(state) == View.Search) {
      return searchArtists(allArtists, search);
    } else {
      return allArtists
        .filter((artist) =>
          selectVisibleTrackGroups(state).includes(artist.artist)
        )
        .sort(
          (a, b) =>
            a.artist?.localeCompare(b.artist!, undefined, {
              sensitivity: "base",
              ignorePunctuation: true
            }) ?? 0
        );
    }
  }
);

export const selectVisibleSearchResults = createSelector(
  [
    (state: RootState) => state.tracks.tracks,
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.search.search
  ],
  () => {
    const state = store.getState();
    const search = selectSearch(state);
    if (!search.trim()) {
      return null;
    }
    const searchResults = searchAllCategories(
      selectAllTracks(state),
      selectAllArtists(state),
      selectAllAlbums(state),
      search
    );
    if (!searchResults) return null;

    return {
      tracks: searchResults.tracks.map((result) => ({
        type: result.type,
        item: {
          ...result.item,
          itemId: search + "/" + (result.item as Track).trackId
        } as TrackListItem,
        score: result.score
      })),
      artists: searchResults.artists,
      albums: searchResults.albums
    };
  }
);
