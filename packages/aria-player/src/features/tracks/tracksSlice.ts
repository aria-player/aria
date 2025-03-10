import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { setupTracksListeners } from "./tracksListeners";
import { Track, TrackId } from "../../../../types/tracks";
import { PluginId } from "../../../../types/plugins";
import { PlaylistItem } from "../playlists/playlistsTypes";

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
      action: PayloadAction<{ source: PluginId; tracks?: Track[] }>
    ) => {
      tracksAdapter.upsertMany(
        state.tracks,
        action.payload.tracks?.map((track) => ({
          ...track,
          albumId: track.albumId ?? (track.album ?? "") + track.albumArtist
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

export default tracksSlice.reducer;

setupTracksListeners();
