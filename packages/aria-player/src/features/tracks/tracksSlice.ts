import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { setupTracksListeners } from "./tracksListeners";
import { Track, TrackId, TrackMetadata } from "../../../../types/tracks";
import { PluginId } from "../../../../types/plugins";
import { PlaylistItem } from "../playlists/playlistsTypes";
import {
  getAlbumId,
  getMostCommonArtworkUri,
  getTrackId
} from "../../app/utils";
import { selectAlbumsInfo } from "../albums/albumsSlice";
import { AlbumDetails } from "./tracksTypes";

const tracksAdapter = createEntityAdapter<Track, TrackId>({
  selectId: (track) => track.trackId,
  sortComparer: (a, b) => b.dateAdded - a.dateAdded
});

interface TracksState {
  tracks: EntityState<Track, TrackId>;
  selectedTracks: PlaylistItem[];
  clipboard: PlaylistItem[];
}

const initialState: TracksState = {
  tracks: tracksAdapter.getInitialState(),
  selectedTracks: [],
  clipboard: []
};

const tracksSlice = createSlice({
  name: "tracks",
  initialState,
  reducers: {
    addTracks: (
      state,
      action: PayloadAction<{
        source: PluginId;
        tracks?: TrackMetadata[];
        addToLibrary: boolean;
      }>
    ) => {
      const { source, tracks, addToLibrary } = action.payload;
      tracksAdapter.upsertMany(
        state.tracks,
        tracks?.map((track) => {
          const trackId = getTrackId(source, track.uri);
          const existingTrack = state.tracks.entities[trackId];
          return {
            ...track,
            trackId,
            source,
            isInLibrary: addToLibrary || existingTrack?.isInLibrary || false
          };
        }) ?? []
      );
    },
    removeTracks: (
      state,
      action: PayloadAction<{ source: PluginId; tracks?: TrackId[] }>
    ) => {
      const tracksToFilter = action.payload.tracks ?? state.tracks.ids;
      const tracksToRemove = tracksToFilter.filter(
        (trackId) =>
          state.tracks.entities[trackId]?.source === action.payload.source
      );
      tracksAdapter.removeMany(state.tracks, tracksToRemove);
    },
    setSelectedTracks: (state, action: PayloadAction<PlaylistItem[]>) => {
      state.selectedTracks = action.payload;
    },
    copySelectedTracks: (state) => {
      state.clipboard = state.selectedTracks;
    }
  }
});

export const {
  addTracks,
  removeTracks,
  setSelectedTracks,
  copySelectedTracks
} = tracksSlice.actions;

export const selectSelectedTracks = (state: RootState) =>
  state.tracks.selectedTracks;
export const selectClipboard = (state: RootState) => state.tracks.clipboard;

export const selectTrackById = (state: RootState, trackId: TrackId) => {
  const track = state.tracks.tracks.entities[trackId];
  if (!track) return undefined;
  return {
    ...track,
    albumId: getAlbumId(
      track.source,
      track.album || "",
      track.albumArtist,
      track.albumUri
    )
  };
};

export const selectAllTracks = createSelector(
  [(state: RootState) => state.tracks.tracks.entities],
  (tracks) =>
    Object.values(tracks).map((track) => ({
      ...track,
      albumId: getAlbumId(
        track.source,
        track.album || "",
        track.albumArtist,
        track.albumUri
      )
    }))
);

const selectAlbumsFromTracks = (
  tracks: Track[],
  state: RootState
): AlbumDetails[] => {
  const albumsMap = new Map<string, AlbumDetails>();
  const albumsInfo = selectAlbumsInfo(state);

  tracks.forEach((track) => {
    if (!track?.albumId || !track.album) return;
    if (!albumsMap.has(track.albumId)) {
      const albumTracks = tracks.filter((t) => t.albumId === track.albumId);
      const albumInfo = albumsInfo[track.albumId];
      albumsMap.set(track.albumId, {
        ...(albumInfo || {}),
        albumId: track.albumId,
        album: albumInfo?.name ?? track.album, // TODO: Rename to 'name' in AlbumDetails
        artist: track.albumArtist || track.artist,
        artistUri: track.albumArtistUri || track.artistUri,
        source: track.source,
        artworkUri: getMostCommonArtworkUri(albumTracks)
      });
    }
  });

  return Array.from(albumsMap.values()).sort((a, b) =>
    a.album.localeCompare(b.album)
  );
};

export const selectAllAlbums = createSelector(
  [(state: RootState) => selectAllTracks(state), (state: RootState) => state],
  selectAlbumsFromTracks
);

export const selectLibraryTracks = createSelector([selectAllTracks], (tracks) =>
  tracks.filter((track) => track.isInLibrary !== false)
);

export const selectLibraryAlbums = createSelector(
  [
    (state: RootState) => selectLibraryTracks(state),
    (state: RootState) => state
  ],
  selectAlbumsFromTracks
);

export default tracksSlice.reducer;

setupTracksListeners();
