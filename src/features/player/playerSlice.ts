import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Status } from "./playerTypes";
import { TrackId } from "../library/libraryTypes";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectTrackById } from "../library/librarySlice";
import { setupPlayerListeners } from "./playerListeners";

interface PlayerState {
  status: Status;
  currentTrackId: TrackId | null;
  volume: number;
  muted: boolean;
}

const initialState: PlayerState = {
  status: Status.Stopped,
  currentTrackId: null,
  volume: 100,
  muted: false
};

export const loadAndPlayTrack = createAsyncThunk(
  "player/loadAndPlayTrack",
  async (id: TrackId, { getState }) => {
    const track = selectTrackById(getState() as RootState, id);
    if (!track) {
      throw new Error("Track not found");
    }
    const plugin = pluginHandles[track?.source] as SourceHandle;
    await plugin.loadAndPlayTrack(track);
    return id;
  }
);

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    pause: (state) => {
      state.status = Status.Paused;
    },
    resume: (state) => {
      state.status = Status.Playing;
    },
    stop: (state) => {
      state.status = Status.Stopped;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setMuted: (state, action) => {
      state.muted = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder.addCase(loadAndPlayTrack.fulfilled, (state, action) => {
      state.status = Status.Playing;
      state.currentTrackId = action.payload;
    });
  }
});

export const { pause, resume, stop, setVolume, setMuted } = playerSlice.actions;

export const selectStatus = (state: RootState) => state.player.status;
export const selectCurrentTrackId = (state: RootState) =>
  state.player.currentTrackId;
export const selectVolume = (state: RootState) => state.player.volume;
export const selectMuted = (state: RootState) => state.player.muted;

export default playerSlice.reducer;

setupPlayerListeners();
