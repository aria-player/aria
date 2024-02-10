import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { RepeatMode, Status } from "./playerTypes";
import { TrackId } from "../tracks/tracksTypes";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { setupPlayerListeners } from "./playerListeners";
import { selectTrackById } from "../tracks/tracksSlice";
import { PlaylistId, PlaylistItem } from "../playlists/playlistsTypes";
import { LibraryView } from "../../app/view";

interface PlayerState {
  status: Status;
  volume: number;
  muted: boolean;
  queue: PlaylistItem[];
  queueUnshuffled: PlaylistItem[];
  queueIndex: number | null;
  queueSource: LibraryView | PlaylistId | null;
  repeatMode: RepeatMode;
  shuffle: boolean;
}

const initialState: PlayerState = {
  status: Status.Stopped,
  volume: 100,
  muted: false,
  queue: [],
  queueUnshuffled: [],
  queueIndex: null,
  queueSource: null,
  repeatMode: RepeatMode.Off,
  shuffle: false
};

function shuffleQueue(queue: PlaylistItem[], queueIndex: number | null) {
  const firstTrack = queueIndex != null ? queue[queueIndex] : null;
  const shuffledTracks = queue.filter((t) => t !== firstTrack);
  shuffledTracks.sort(() => Math.random() - 0.5);
  if (queueIndex != null) {
    shuffledTracks.unshift(firstTrack as PlaylistItem);
  }
  return shuffledTracks;
}

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
      state.volume = Math.min(Math.max(action.payload, 0), 100);
    },
    setMuted: (state, action) => {
      state.muted = action.payload;
    },
    setQueue: (
      state,
      action: PayloadAction<{
        queue: PlaylistItem[];
        queueIndex: number | null;
        queueSource: LibraryView | PlaylistId;
      }>
    ) => {
      state.queueUnshuffled = action.payload.queue;
      state.queueIndex = action.payload.queueIndex;
      if (state.shuffle) {
        state.queue = shuffleQueue(state.queueUnshuffled, state.queueIndex);
        if (state.queueIndex != null) state.queueIndex = 0;
      } else {
        state.queue = state.queueUnshuffled;
      }
      state.queueSource = action.payload.queueSource;
    },
    nextTrack: (state) => {
      if (state.queueIndex !== null) {
        state.queueIndex += 1;
        if (state.queueIndex >= state.queue.length) {
          if (state.repeatMode != RepeatMode.Off) {
            state.queueIndex = 0;
            if (state.shuffle) {
              state.queue = shuffleQueue(
                state.queueUnshuffled,
                state.queueIndex
              );
            }
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
    },
    toggleShuffle: (state) => {
      state.shuffle = !state.shuffle;
      if (state.queueIndex != null) {
        const firstTrack = state.queue[state.queueIndex];
        if (state.shuffle) {
          state.queue = shuffleQueue(state.queue, state.queueIndex);
          state.queueIndex = 0;
        } else {
          state.queue = state.queueUnshuffled;
          state.queueIndex = state.queue.findIndex(
            (t) => t.itemId === firstTrack.itemId
          );
        }
      }
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
  cycleRepeatMode,
  toggleShuffle
} = playerSlice.actions;

export const selectStatus = (state: RootState) => state.player.status;
export const selectVolume = (state: RootState) => state.player.volume;
export const selectMuted = (state: RootState) => state.player.muted;
export const selectQueue = (state: RootState) => state.player.queue;
export const selectQueueIndex = (state: RootState) => state.player.queueIndex;
export const selectQueueSource = (state: RootState) => state.player.queueSource;
export const selectRepeatMode = (state: RootState) => state.player.repeatMode;
export const selectShuffle = (state: RootState) => state.player.shuffle;

export default playerSlice.reducer;

setupPlayerListeners();
