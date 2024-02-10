import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { setupTracksListeners } from "./tracksListeners";
import { Track, TrackId } from "./tracksTypes";
import { PluginId } from "../plugins/pluginsTypes";
import { PlaylistItem } from "../playlists/playlistsTypes";

const tracksAdapter = createEntityAdapter<Track>({
  selectId: (track) => track.trackId
});

interface TracksState {
  tracks: EntityState<Track>;
  selectedTracks: PlaylistItem[];
}

const initialState: TracksState = {
  tracks: tracksAdapter.getInitialState(),
  selectedTracks: []
};

const tracksSlice = createSlice({
  name: "tracks",
  initialState,
  reducers: {
    addTracks: (
      state,
      action: PayloadAction<{ source: PluginId; tracks?: Track[] }>
    ) => {
      tracksAdapter.upsertMany(state.tracks, action.payload.tracks ?? []);
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
    }
  }
});

export const { addTracks, removeTracks, setSelectedTracks } =
  tracksSlice.actions;

export const {
  selectIds: selectTrackIds,
  selectAll: selectAllTracks,
  selectById: selectTrackById
} = tracksAdapter.getSelectors((state: RootState) => state.tracks.tracks);
export const selectSelectedTracks = (state: RootState) =>
  state.tracks.selectedTracks;

export default tracksSlice.reducer;

setupTracksListeners();
