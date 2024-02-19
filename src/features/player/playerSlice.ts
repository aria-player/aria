import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { RepeatMode, Status } from "./playerTypes";
import { TrackId } from "../tracks/tracksTypes";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { setupPlayerListeners } from "./playerListeners";
import { selectTrackById } from "../tracks/tracksSlice";
import {
  PlaylistId,
  PlaylistItem,
  PlaylistItemId
} from "../playlists/playlistsTypes";
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
  currentTrackNotInPlaylist: boolean;
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
  shuffle: false,
  currentTrackNotInPlaylist: false
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
    setQueueToNewSource: (
      state,
      action: PayloadAction<{
        queue: PlaylistItem[];
        queueIndex: number;
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
      state.currentTrackNotInPlaylist = false;
    },
    updateQueueAfterChange: (state, action: PayloadAction<PlaylistItem[]>) => {
      const newPlaylistTracks = action.payload;
      if (state.queueIndex != null) {
        const currentItemId = state.queue[state.queueIndex].itemId;
        if (!newPlaylistTracks.find((item) => item.itemId == currentItemId)) {
          // The current track isn't in the updated playlist, so it was removed
          // Prevent it from being removed from the queue as this would interrupt playback
          state.currentTrackNotInPlaylist = true;
          state.queueUnshuffled = state.queueUnshuffled.filter(
            (oldItem) =>
              newPlaylistTracks.some(
                (newItem) => newItem.itemId === oldItem.itemId
              ) || oldItem.itemId === currentItemId
          );
        } else {
          state.currentTrackNotInPlaylist = false;
          state.queueUnshuffled = newPlaylistTracks;
        }
        state.queueIndex = state.queueUnshuffled.findIndex(
          (track) => track.itemId == currentItemId
        );
        // Re-shuffle the queue
        if (state.shuffle) {
          state.queue = shuffleQueue(state.queueUnshuffled, state.queueIndex);
          if (state.queueIndex != null) state.queueIndex = 0;
        } else {
          state.queue = state.queueUnshuffled;
        }
      }
    },
    reorderQueue: (state, action: PayloadAction<PlaylistItem[]>) => {
      if (state.queueIndex != null) {
        const startOfQueue = state.queue.slice(0, state.queueIndex);
        state.queue = startOfQueue.concat(action.payload);
      } else {
        state.queue = action.payload;
      }
    },
    removeFromQueue: (state, action: PayloadAction<PlaylistItemId[]>) => {
      state.queue = state.queue.filter(
        (track) => !action.payload.includes(track.itemId)
      );
      state.queueUnshuffled = state.queueUnshuffled.filter(
        (track) => !action.payload.includes(track.itemId)
      );
    },
    skipQueueIndexes: (state, action) => {
      state.queueIndex = state.queueIndex + action.payload;
    },
    nextTrack: (state) => {
      if (state.queueIndex != null) {
        if (state.currentTrackNotInPlaylist) {
          const currentItemId = state.queue[state.queueIndex].itemId;
          state.queueUnshuffled = state.queueUnshuffled.filter(
            (item) => item.itemId != currentItemId
          );
          state.queue = state.queue.filter(
            (item) => item.itemId != currentItemId
          );
          state.currentTrackNotInPlaylist = false;
        } else {
          state.queueIndex += 1;
        }

        if (state.queueIndex >= state.queue.length) {
          if (state.repeatMode != RepeatMode.Off && state.queue.length > 0) {
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
      if (state.queueIndex != null) {
        if (state.currentTrackNotInPlaylist) {
          const currentItemId = state.queue[state.queueIndex].itemId;
          state.queueUnshuffled = state.queueUnshuffled.filter(
            (item) => item.itemId != currentItemId
          );
          state.queue = state.queue.filter(
            (item) => item.itemId != currentItemId
          );
          state.currentTrackNotInPlaylist = false;
        }

        state.queueIndex -= 1;
        if (state.queueIndex < 0) {
          if (state.repeatMode != RepeatMode.Off && state.queue.length > 0) {
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
  setQueueToNewSource,
  updateQueueAfterChange,
  reorderQueue,
  removeFromQueue,
  skipQueueIndexes,
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
