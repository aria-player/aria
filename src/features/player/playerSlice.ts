import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { RepeatMode, Status } from "./playerTypes";
import { TrackId } from "../library/libraryTypes";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectTrackById } from "../library/librarySlice";
import { setupPlayerListeners } from "./playerListeners";

interface PlayerState {
  status: Status;
  volume: number;
  muted: boolean;
  queue: TrackId[];
  queueIndex: number | null;
  repeatMode: RepeatMode;
}

const initialState: PlayerState = {
  status: Status.Stopped,
  volume: 100,
  muted: false,
  queue: [],
  queueIndex: null,
  repeatMode: RepeatMode.Off
};

export const loadAndPlayTrack = createAsyncThunk(
  "player/loadAndPlayTrack",
  async (trackId: TrackId, { getState }) => {
    const state = getState() as RootState;
    if (state.player.queueIndex === null) {
      throw new Error("Queue index null");
    }
    const track = selectTrackById(getState() as RootState, trackId);
    if (!track) {
      throw new Error("Track not found");
    }
    const plugin = pluginHandles[track?.source] as SourceHandle;
    if (!plugin) {
      throw new Error("Plugin not found");
    }
    await plugin.loadAndPlayTrack(track);
  }
);

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    pause: (state) => {
      if (state.status === Status.Playing) {
        state.status = Status.Paused;
      }
    },
    resume: (state) => {
      if (state.status === Status.Paused) {
        state.status = Status.Playing;
      }
    },
    stop: (state) => {
      state.status = Status.Stopped;
    },
    setVolume: (state, action) => {
      state.volume = action.payload;
    },
    setMuted: (state, action) => {
      state.muted = action.payload;
    },
    setQueue: (
      state,
      action: PayloadAction<{ queue: TrackId[]; queueIndex: number }>
    ) => {
      state.queue = action.payload.queue;
      state.queueIndex = action.payload.queueIndex;
    },
    nextTrack: (state) => {
      if (state.queueIndex !== null) {
        state.queueIndex += 1;
        if (state.queueIndex >= state.queue.length) {
          if (state.repeatMode != RepeatMode.Off) {
            state.queueIndex = 0;
          } else {
            state.queueIndex = null;
            state.status = Status.Stopped;
          }
        }
      }
    },
    previousTrack: (state) => {
      if (state.queueIndex !== null) {
        state.queueIndex -= 1;
        if (state.queueIndex < 0) {
          if (state.repeatMode != RepeatMode.Off) {
            state.queueIndex = state.queue.length - 1;
          } else {
            state.queueIndex = null;
            state.status = Status.Stopped;
          }
        }
      }
    },
    cycleRepeatMode: (state) => {
      const modes = Object.values(RepeatMode).filter(
        (v) => !isNaN(Number(v))
      ).length;
      state.repeatMode = (state.repeatMode + 1) % modes;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadAndPlayTrack.rejected, (state) => {
        state.status = Status.Stopped;
      })
      .addCase(loadAndPlayTrack.pending, (state) => {
        state.status = Status.Loading;
      })
      .addCase(loadAndPlayTrack.fulfilled, (state) => {
        state.status = Status.Playing;
      });
  }
});

export const {
  pause,
  resume,
  stop,
  setVolume,
  setMuted,
  setQueue,
  nextTrack,
  previousTrack,
  cycleRepeatMode
} = playerSlice.actions;

export const selectStatus = (state: RootState) => state.player.status;
export const selectVolume = (state: RootState) => state.player.volume;
export const selectMuted = (state: RootState) => state.player.muted;
export const selectQueue = (state: RootState) => state.player.queue;
export const selectQueueIndex = (state: RootState) => state.player.queueIndex;
export const selectRepeatMode = (state: RootState) => state.player.repeatMode;

export default playerSlice.reducer;

setupPlayerListeners();
