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
import { AlbumDetails } from "./tracksTypes";
import { getMostCommonArtworkUri, getTrackId } from "../../app/utils";

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
      action: PayloadAction<{ source: PluginId; tracks?: TrackMetadata[] }>
    ) => {
      tracksAdapter.upsertMany(
        state.tracks,
        action.payload.tracks?.map((track) => ({
          ...track,
          trackId: getTrackId(action.payload.source, track.uri),
          albumId:
            track.albumUri ??
            `${track.album ?? ""} ${
              Array.isArray(track.albumArtist)
                ? track.albumArtist.join(" ")
                : (track.albumArtist ?? "")
            }`,
          source: action.payload.source
        })) ?? []
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

export const {
  selectIds: selectTrackIds,
  selectAll: selectAllTracks,
  selectById: selectTrackById
} = tracksAdapter.getSelectors((state: RootState) => state.tracks.tracks);
export const selectSelectedTracks = (state: RootState) =>
  state.tracks.selectedTracks;
export const selectClipboard = (state: RootState) => state.tracks.clipboard;

export const selectAllAlbums = createSelector(
  [(state: RootState) => state.tracks.tracks.entities],
  (tracksById) => {
    const albumsMap = new Map<string, AlbumDetails>();
    const tracks = Object.values(tracksById);
    tracks.forEach((track) => {
      if (!track?.albumId || !track.album) return;
      if (!albumsMap.has(track.albumId)) {
        const albumTracks = tracks.filter((t) => t.albumId === track.albumId);
        albumsMap.set(track.albumId, {
          albumId: track.albumId,
          album: track.album,
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
  }
);

export default tracksSlice.reducer;

setupTracksListeners();
