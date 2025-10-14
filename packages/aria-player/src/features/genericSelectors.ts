import { RootState, store } from "../app/store";
import {
  selectPlaylistById,
  selectPlaylistConfigById
} from "./playlists/playlistsSlice";
import { TrackListItem } from "./tracks/tracksTypes";
import { TrackGrouping } from "../app/view";
import { PlaylistId, PlaylistItem } from "./playlists/playlistsTypes";
import { selectLibraryColumnState } from "./library/librarySlice";
import { getArtistId, getAsArray, overrideColumnStateSort } from "../app/utils";
import { compareMetadata } from "../app/sort";
import { selectAllTracks } from "./tracks/tracksSlice";
import { createSelector } from "@reduxjs/toolkit";
import { selectArtistInfoById } from "./artists/artistsSlice";
import { ArtistDetails } from "./artists/artistsTypes";

export const selectTrackListMetadata = (
  state: RootState,
  playlistId?: PlaylistId
): TrackListItem[] => {
  const playlist = playlistId
    ? selectPlaylistById(state, playlistId)
    : undefined;
  return playlist
    ? playlist.tracks.map((track) => ({
        ...track,
        ...state.tracks.tracks.entities[track.trackId]
      }))
    : (selectAllTracks(state).map((track) => ({
        ...track,
        itemId: track?.trackId
      })) as TrackListItem[]);
};

export const selectSortedTrackList = (
  state: RootState,
  playlistId?: PlaylistId
): PlaylistItem[] => {
  // 1. Get tracks with metadata
  const tracks = selectTrackListMetadata(state, playlistId);

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
      .filter((col) => col.sort)
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

export const selectGroupFilteredTracks = (
  state: RootState,
  trackGrouping?: TrackGrouping | null,
  selectedTrackGroup?: string | null,
  playlistId?: PlaylistId
): TrackListItem[] => {
  if (!trackGrouping || !selectedTrackGroup) return [];
  return selectTrackListMetadata(state, playlistId)
    .filter(
      (track) =>
        track[trackGrouping] == selectedTrackGroup ||
        (selectedTrackGroup &&
          Array.isArray(track[trackGrouping]) &&
          (track[trackGrouping] as string[])?.includes(selectedTrackGroup))
    )
    .sort((a, b) => compareMetadata(a.track, b.track))
    .sort((a, b) => compareMetadata(a.disc, b.disc))
    .sort((a, b) => compareMetadata(a.album, b.album))
    .sort((a, b) => compareMetadata(a.albumId, b.albumId))
    .sort((a, b) => compareMetadata(a.year, b.year));
};

export const selectAlbumTitle = (state: RootState, albumId: string | null) => {
  return selectAllTracks(state).find((track) => track.albumId === albumId)
    ?.album;
};

export const selectAllArtists = createSelector(
  [
    (state: RootState) => state.tracks.tracks.entities,
    (state: RootState) => state.artists.artists
  ],
  (tracksById) => {
    const state = store.getState();
    const artistsMap = new Map<string, ArtistDetails>();
    Object.values(tracksById).forEach((track) => {
      if (!track) return;
      const artists = getAsArray(track.artist);
      const artistUris = getAsArray(track.artistUri);
      const albumArtists = getAsArray(track.albumArtist);
      const albumArtistUris = getAsArray(track.albumArtistUri);
      [
        ...artists.map((name, index) => ({
          name,
          source: track.source,
          uri: artistUris[index] ? artistUris[index] : undefined
        })),
        ...albumArtists.map((name, index) => ({
          name,
          source: track.source,
          uri: albumArtistUris[index] ? albumArtistUris[index] : undefined
        }))
      ].forEach(({ name, source, uri }) => {
        const artistId = uri ? getArtistId(source, uri) : name;
        if (!artistsMap.has(artistId)) {
          artistsMap.set(artistId, {
            ...(selectArtistInfoById(state, artistId) || {}),
            artistId,
            uri,
            name,
            source,
            firstTrackArtworkUri: track.artworkUri
          });
        }
      });
    });

    return Array.from(artistsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }
);
