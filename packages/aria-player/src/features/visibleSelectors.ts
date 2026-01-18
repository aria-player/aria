import { createSelector } from "@reduxjs/toolkit";
import { RootState, store } from "../app/store";
import {
  LibraryView,
  isLibraryView,
  View,
  DisplayMode,
  TrackGrouping,
  SettingsSection,
  SearchCategory,
  ArtistSection
} from "../app/view";
import { selectLibrarySplitViewStates } from "./library/librarySlice";
import {
  selectPlaylistById,
  selectPlaylistConfigById
} from "./playlists/playlistsSlice";
import { PlaylistItem } from "./playlists/playlistsTypes";
import {
  selectAllAlbums,
  selectAllArtists,
  selectGroupFilteredTracks,
  selectLibraryAlbums,
  selectLibraryArtists
} from "./genericSelectors";
import { AlbumDetails } from "./albums/albumsTypes";
import { ArtistDetails } from "./artists/artistsTypes";
import { TrackListItem } from "./tracks/tracksTypes";
import { Track } from "../../../types/tracks";
import {
  selectAllTracks,
  selectTrackById,
  selectLibraryTracks
} from "./tracks/tracksSlice";
import {
  searchTracks,
  searchArtists,
  searchAlbums,
  searchAllCategories
} from "../app/search";
import { selectSearch } from "./search/searchSlice";
import { BASEPATH } from "../app/constants";
import { selectArtistDelimiter } from "./config/configSlice";
import { getAsArray, normalizeArtists } from "../app/utils";
import { compareMetadata } from "../app/sort";
import { PluginId } from "../../../types";

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

export const selectVisibleSearchSource = (
  state: RootState
): PluginId | null => {
  if (selectVisibleViewType(state) == View.Search) {
    const thirdPath = state.router.location?.pathname
      .substring(BASEPATH.length)
      .split("/")[2];
    if (thirdPath && thirdPath !== "library") {
      return decodeURIComponent(thirdPath) as PluginId;
    }
  }
  return null;
};

export const selectVisibleSearchCategory = (state: RootState) => {
  if (selectVisibleViewType(state) == View.Search) {
    const fourthPath = state.router.location?.pathname
      .substring(BASEPATH.length)
      .split("/")[3];
    if (!fourthPath) {
      return null;
    } else if (
      Object.values(SearchCategory).includes(fourthPath as SearchCategory)
    ) {
      return fourthPath as SearchCategory;
    }
  }
};

export const selectVisibleArtistSection = (state: RootState) => {
  const pathParts = state.router.location?.pathname
    .substring(BASEPATH.length)
    .split("/");
  if (pathParts && pathParts.length > 2 && pathParts[0] === View.Artist) {
    return pathParts[2] as ArtistSection;
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
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.search.search,
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists.playlists,
    (state: RootState) => selectVisibleSearchSource(state)
  ],
  () => {
    const state = store.getState();
    const visiblePlaylist = selectVisiblePlaylist(state)?.tracks;
    const visibleViewType = selectVisibleViewType(state);
    const visibleSelectedTrackGroup = selectVisibleSelectedTrackGroup(state);
    const search = selectSearch(state);

    if (visibleViewType === View.Artist && visibleSelectedTrackGroup) {
      return selectVisibleArtistTracks(state);
    }

    return visiblePlaylist
      ? visiblePlaylist.map((playlistTrack) => {
          return {
            ...playlistTrack,
            ...selectTrackById(state, playlistTrack.trackId)
          };
        })
      : Object.values(LibraryView).includes(
            selectVisibleViewType(state) as LibraryView
          )
        ? (selectLibraryTracks(state).map((track) => ({
            ...track,
            itemId: track?.trackId
          })) as TrackListItem[])
        : selectVisibleViewType(state) == View.Search
          ? (() => {
              const visibleSource = selectVisibleSearchSource(state);
              const searchResults = searchTracks(
                selectLibraryTracks(state),
                search
              );
              return (
                visibleSource
                  ? searchResults.filter(
                      (track) => track.source == visibleSource
                    )
                  : searchResults
              ).map((track) => ({
                ...track,
                itemId: track?.trackId
              })) as TrackListItem[];
            })()
          : visibleViewType == View.Album && visibleSelectedTrackGroup
            ? (selectAllTracks(state)
                .filter((track) => track.albumId === visibleSelectedTrackGroup)
                .map((track) => ({
                  ...track,
                  itemId: track?.trackId
                })) as TrackListItem[])
            : [];
  }
);

export const selectVisibleGroupFilteredTracks = createSelector(
  [
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.library.splitViewStates,
    (state: RootState) => state.undoable.present.playlists.playlists,
    (state: RootState) => state.undoable.present.playlists.playlistsConfig
  ],
  () => {
    const state = store.getState();
    return selectGroupFilteredTracks(
      state,
      selectVisibleViewType(state),
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
    selectVisibleViewType(state),
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
      selectSearch(state) != "") ||
    selectVisibleArtistSection(state) === ArtistSection.Songs
  )
    return DisplayMode.TrackList;
  if (
    selectVisibleViewType(state) === LibraryView.Albums ||
    selectVisibleSearchCategory(state) == SearchCategory.Albums ||
    selectVisibleArtistSection(state) === ArtistSection.Albums
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
  if (selectVisibleViewType(state) === View.Album) return TrackGrouping.AlbumId;
  if (selectVisibleSearchCategory(state) == SearchCategory.Artists) {
    // Technically both Artist and AlbumArtist, but this shouldn't cause problems for the ArtistGrid
    return TrackGrouping.Artist;
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

  if (firstPath === View.Album || firstPath === View.Artist) {
    return decodeURIComponent(secondPath);
  }

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
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.search.search,
    (state: RootState) => selectArtistDelimiter(state),
    (state: RootState) => selectVisibleSearchSource(state),
    (state: RootState) => selectVisibleSearchCategory(state)
  ],
  () => {
    const state = store.getState();
    const delimiter = selectArtistDelimiter(state);
    if (selectVisibleDisplayMode(state) == DisplayMode.AlbumGrid) {
      const search = selectSearch(state);
      if (selectVisibleSearchCategory(state) == SearchCategory.Albums) {
        const visibleSource = selectVisibleSearchSource(state);
        const searchResults = searchAlbums(selectLibraryAlbums(state), search);
        return (
          visibleSource
            ? searchResults.filter((album) => album.source == visibleSource)
            : searchResults
        ).map((album) => album.albumId);
      } else {
        return [
          ...new Set(selectVisibleTracks(state).map((track) => track.albumId))
        ];
      }
    } else if (selectVisibleSearchCategory(state) == SearchCategory.Artists) {
      const search = selectSearch(state);
      const visibleSource = selectVisibleSearchSource(state);
      const searchResults = searchArtists(selectLibraryArtists(state), search);
      return (
        visibleSource
          ? searchResults.filter((artist) => artist.source == visibleSource)
          : searchResults
      ).map((group) => group.name);
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
              .flatMap((track) => {
                if (
                  grouping === TrackGrouping.Artist ||
                  grouping === TrackGrouping.AlbumArtist
                ) {
                  const artists = getAsArray(track[grouping]);
                  if (
                    delimiter &&
                    artists.length === 1 &&
                    ((grouping === TrackGrouping.Artist &&
                      !track.artistUri?.length) ||
                      (grouping === TrackGrouping.AlbumArtist &&
                        !track.albumArtistUri?.length))
                  ) {
                    return artists[0].split(delimiter);
                  }
                  return artists;
                }
                return track[grouping] as string | string[];
              })
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

export const selectVisibleAlbums = createSelector(
  [
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => state.undoable.present.playlists,
    (state: RootState) => state.undoable.present.library,
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.search.search,
    (state: RootState) => selectVisibleSearchSource(state),
    (state: RootState) => selectVisibleSearchCategory(state)
  ],
  () => {
    const state = store.getState();
    const allAlbums = selectAllAlbums(state);
    const search = selectSearch(state);
    const visibleViewType = selectVisibleViewType(state);

    if (visibleViewType === View.Artist) {
      return selectVisibleArtistAlbums(state);
    } else if (search && visibleViewType == View.Search) {
      const visibleSource = selectVisibleSearchSource(state);
      const searchResults = searchAlbums(selectLibraryAlbums(state), search);
      return visibleSource
        ? searchResults.filter((album) => album.source == visibleSource)
        : searchResults;
    } else {
      return allAlbums
        .filter((album) =>
          selectVisibleTrackGroups(state).includes(album.albumId)
        )
        .sort(
          (a, b) =>
            a.name.localeCompare(b.name, undefined, {
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
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.search.search,
    (state: RootState) => selectVisibleSearchSource(state),
    (state: RootState) => selectVisibleSearchCategory(state)
  ],
  () => {
    const state = store.getState();
    const allArtists = selectAllArtists(state);
    const search = selectSearch(state);
    if (search && selectVisibleViewType(state) == View.Search) {
      const visibleSource = selectVisibleSearchSource(state);
      const searchResults = searchArtists(selectLibraryArtists(state), search);
      return visibleSource
        ? searchResults.filter((artist) => artist.source == visibleSource)
        : searchResults;
    } else {
      return allArtists
        .filter((artist) =>
          selectVisibleTrackGroups(state).includes(artist.name)
        )
        .sort(
          (a, b) =>
            a.name?.localeCompare(b.name!, undefined, {
              sensitivity: "base",
              ignorePunctuation: true
            }) ?? 0
        );
    }
  }
);

export const selectVisibleArtist = createSelector(
  [
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.router.location?.pathname
  ],
  () => {
    const state = store.getState();
    const visibleSelectedTrackGroup = selectVisibleSelectedTrackGroup(state);
    if (
      selectVisibleViewType(state) === View.Artist &&
      visibleSelectedTrackGroup
    ) {
      return selectAllArtists(state).find(
        (a) =>
          a.artistId === visibleSelectedTrackGroup ||
          (a.name === visibleSelectedTrackGroup && !a.artistId)
      );
    }
  }
);

export const selectVisibleArtistTracks = createSelector(
  [
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => selectArtistDelimiter(state)
  ],
  () => {
    const state = store.getState();
    const delimiter = selectArtistDelimiter(state);
    const visibleViewType = selectVisibleViewType(state);
    const visibleArtist = selectVisibleArtist(state);
    if (visibleViewType === View.Artist && visibleArtist) {
      return selectAllTracks(state)
        .filter((track) => {
          return (
            normalizeArtists(
              track.artist,
              track.artistUri,
              track.source,
              delimiter
            ).some((artist) => artist.id == visibleArtist.artistId) ||
            normalizeArtists(
              track.albumArtist,
              track.albumArtistUri,
              track.source,
              delimiter
            ).some((artist) => artist.id == visibleArtist.artistId)
          );
        })
        .map((track) => ({
          ...track,
          itemId: track.trackId
        })) as TrackListItem[];
    }
    return [];
  }
);

export const selectVisibleArtistAlbums = createSelector(
  [
    (state: RootState) => selectAllTracks(state),
    (state: RootState) => state.router.location?.pathname,
    (state: RootState) => selectArtistDelimiter(state)
  ],
  () => {
    const state = store.getState();
    const delimiter = selectArtistDelimiter(state);
    const visibleViewType = selectVisibleViewType(state);
    const visibleArtist = selectVisibleArtist(state);
    if (visibleViewType === View.Artist && visibleArtist) {
      return selectAllAlbums(state)
        .filter((album) => {
          return normalizeArtists(
            album.artist,
            album.artistUri,
            album.source,
            delimiter
          ).some((artist) => artist.id == visibleArtist.artistId);
        })
        .sort((a, b) => compareMetadata(a.year, b.year, true))
        .sort((a, b) => compareMetadata(a.dateReleased, b.dateReleased, true));
    }
    return [];
  }
);

export const selectVisibleSearchResults = createSelector(
  [
    (state: RootState) => selectLibraryTracks(state),
    (state: RootState) => selectVisibleSearchSource(state),
    (state: RootState) => selectVisibleSearchCategory(state),
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
      selectLibraryTracks(state),
      selectLibraryArtists(state),
      selectLibraryAlbums(state),
      search
    );
    if (!searchResults) return null;

    const visibleSource = selectVisibleSearchSource(state);
    return {
      tracks: (visibleSource
        ? searchResults.tracks.filter(
            (result) => (result.item as Track).source == visibleSource
          )
        : searchResults.tracks
      ).map((result) => ({
        type: result.type,
        item: {
          ...result.item,
          itemId: (result.item as Track).trackId
        } as TrackListItem,
        score: result.score
      })),
      artists: visibleSource
        ? searchResults.artists.filter(
            (result) => (result.item as ArtistDetails).source == visibleSource
          )
        : searchResults.artists,
      albums: visibleSource
        ? searchResults.albums.filter(
            (result) => (result.item as AlbumDetails).source == visibleSource
          )
        : searchResults.albums
    };
  }
);
