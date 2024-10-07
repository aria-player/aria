import { PayloadAction, createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { QueueItem, RepeatMode, Status } from "./playerTypes";
import { TrackId } from "../tracks/tracksTypes";
import { getSourceHandle } from "../plugins/pluginsSlice";
import { setupPlayerListeners } from "./playerListeners";
import { selectTrackById } from "../tracks/tracksSlice";
import { PlaylistId, PlaylistItemId } from "../playlists/playlistsTypes";
import { LibraryView, TrackGrouping } from "../../app/view";

interface PlayerState {
  status: Status;
  volume: number;
  muted: boolean;
  currentTrack: QueueItem | null;
  queue: QueueItem[];
  queueUnshuffled: QueueItem[];
  queueIndex: number | null;
  queueSource: LibraryView | PlaylistId | null;
  queueGrouping: TrackGrouping | null;
  queueSelectedGroup: string | null;
  upNext: QueueItem[];
  repeatMode: RepeatMode;
  shuffle: boolean;
}

const initialState: PlayerState = {
  status: Status.Stopped,
  volume: 100,
  muted: false,
  currentTrack: null,
  queue: [],
  queueUnshuffled: [],
  queueIndex: null,
  queueSource: null,
  queueGrouping: null,
  queueSelectedGroup: null,
  upNext: [],
  repeatMode: RepeatMode.Off,
  shuffle: false
};

function shuffleQueue(queue: QueueItem[], queueIndex: number | null) {
  const firstTrack = queueIndex != null ? queue[queueIndex] : null;
  const shuffledTracks = queue.filter((t) => t !== firstTrack);
  shuffledTracks.sort(() => Math.random() - 0.5);
  if (queueIndex != null) {
    shuffledTracks.unshift(firstTrack as QueueItem);
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
    const plugin = getSourceHandle(track.source);
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
        queue: QueueItem[];
        queueIndex: number;
        queueSource: LibraryView | PlaylistId;
        queueGrouping: TrackGrouping | null;
        queueSelectedGroup: string | null;
      }>
    ) => {
      state.queueUnshuffled = action.payload.queue;
      state.queueIndex = action.payload.queueIndex;
      if (state.shuffle) {
        state.queue = shuffleQueue(state.queueUnshuffled, state.queueIndex);
        if (state.queueIndex != null) {
          state.queueIndex = 0;
          state.currentTrack = state.queue[0];
        }
      } else {
        state.queue = state.queueUnshuffled;
        state.currentTrack = state.queue[state.queueIndex];
      }
      state.queueSource = action.payload.queueSource;
      state.queueGrouping = action.payload.queueGrouping;
      state.queueSelectedGroup = action.payload.queueSelectedGroup;
    },
    updateQueueAfterChange: (state, action: PayloadAction<QueueItem[]>) => {
      const newPlaylistTracks = action.payload;
      if (state.queueIndex != null) {
        const currentItemId = state.queue[state.queueIndex].itemId;
        if (!newPlaylistTracks.find((item) => item.itemId == currentItemId)) {
          // The current track isn't in the updated playlist, so it was removed
          // Prevent it from being removed from the queue as this would interrupt playback
          state.queue[state.queueIndex].stray = true;
          state.queueUnshuffled = state.queueUnshuffled.filter(
            (oldItem) =>
              newPlaylistTracks.some(
                (newItem) => newItem.itemId === oldItem.itemId
              ) || oldItem.itemId === currentItemId
          );
        } else {
          state.queue[state.queueIndex].stray = false;
          state.queueUnshuffled = newPlaylistTracks;
        }
        state.queueIndex = state.queueUnshuffled.findIndex(
          (track) => track.itemId == currentItemId
        );
        if (state.queueIndex == -1) state.queueIndex = 0;
        // Re-shuffle the queue
        if (state.shuffle) {
          state.queue = shuffleQueue(state.queueUnshuffled, state.queueIndex);
          if (state.queueIndex != null) state.queueIndex = 0;
        } else {
          state.queue = state.queueUnshuffled;
        }
      }
    },
    reorderQueue: (state, action: PayloadAction<QueueItem[]>) => {
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
      state.upNext = state.upNext.filter(
        (track) => !action.payload.includes(track.itemId)
      );
    },
    skipQueueIndexes: (state, action) => {
      if (action.payload == 0) return;
      if (action.payload <= state.upNext.length) {
        state.currentTrack = state.upNext[action.payload - 1];
        state.upNext.splice(0, action.payload);
      } else {
        state.queueIndex =
          state.queueIndex! + action.payload - state.upNext.length;
        state.currentTrack = state.queue[state.queueIndex!];
      }
    },
    nextTrack: (state) => {
      if (state.upNext.length > 0) {
        state.currentTrack = state.upNext.shift() || null;
      } else if (state.queueIndex != null) {
        if (state.queue[state.queueIndex].stray) {
          const currentItemId = state.queue[state.queueIndex].itemId;
          state.queueUnshuffled = state.queueUnshuffled.filter(
            (item) => item.itemId != currentItemId
          );
          state.queue = state.queue.filter(
            (item) => item.itemId != currentItemId
          );
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
            state.currentTrack = null;
          }
        }
        state.currentTrack =
          state.queueIndex != null ? state.queue[state.queueIndex] : null;
      }
    },
    previousTrack: (state) => {
      if (state.queueIndex != null) {
        if (
          !state.queue[state.queueIndex]?.stray &&
          state.currentTrack?.itemId == state.queue[state.queueIndex].itemId
        ) {
          state.queueIndex -= 1;
        }
        while (state.queue[state.queueIndex]?.stray) {
          const currentItemId = state.queue[state.queueIndex].itemId;
          state.queueUnshuffled = state.queueUnshuffled.filter(
            (item) => item.itemId != currentItemId
          );
          state.queue = state.queue.filter(
            (item) => item.itemId != currentItemId
          );
          state.queueIndex -= 1;
        }

        if (state.queueIndex < 0) {
          if (state.repeatMode != RepeatMode.Off && state.queue.length > 0) {
            state.queueIndex = state.queue.length - 1;
          } else {
            state.queueIndex = null;
            state.status = Status.Stopped;
          }
        }
      }
      state.currentTrack =
        state.queueIndex != null ? state.queue[state.queueIndex] : null;
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
        if (state.shuffle) {
          state.queue = shuffleQueue(state.queue, state.queueIndex);
          state.queueIndex = 0;
        } else {
          let startFromIndex = 0;
          const newQueue = [...state.queueUnshuffled];
          if (state.queue[state.queueIndex].stray) {
            for (let i = state.queueIndex; i >= 0; i--) {
              if (!state.queue[i].stray) {
                startFromIndex = i;
                break;
              }
            }
            newQueue.splice(startFromIndex, 0, state.queue[state.queueIndex]);
          } else {
            startFromIndex = state.queueUnshuffled.findIndex(
              (t) => t.itemId === state.queue[state.queueIndex!].itemId
            );
          }
          state.queue = newQueue;
          state.queueIndex = startFromIndex;
        }
      }
    },
    addStrayTracksToQueue: (
      state,
      action: PayloadAction<{ dropIndex: number; tracks: QueueItem[] }>
    ) => {
      if (state.queueIndex != null) {
        state.queue.splice(
          state.queueIndex + action.payload.dropIndex,
          0,
          ...action.payload.tracks.map((track) => ({
            ...track,
            stray: true
          }))
        );
      }
    },
    addTracksToUpNext: (
      state,
      action: PayloadAction<{
        dropIndex?: number;
        tracks: QueueItem[];
      }>
    ) => {
      state.upNext.splice(
        action.payload.dropIndex ?? state.upNext.length,
        0,
        ...action.payload.tracks
      );
    },
    reorderUpNext: (state, action: PayloadAction<QueueItem[]>) => {
      state.upNext = action.payload;
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
  toggleShuffle,
  addStrayTracksToQueue,
  addTracksToUpNext,
  reorderUpNext
} = playerSlice.actions;

export const selectStatus = (state: RootState) => state.player.status;
export const selectVolume = (state: RootState) => state.player.volume;
export const selectMuted = (state: RootState) => state.player.muted;
export const selectQueue = (state: RootState) => state.player.queue;
export const selectQueueIndex = (state: RootState) => state.player.queueIndex;
export const selectQueueSource = (state: RootState) => state.player.queueSource;
export const selectQueueGrouping = (state: RootState) =>
  state.player.queueGrouping;
export const selectQueueSelectedGroup = (state: RootState) =>
  state.player.queueSelectedGroup;
export const selectUpNext = (state: RootState) => state.player.upNext;
export const selectRepeatMode = (state: RootState) => state.player.repeatMode;
export const selectShuffle = (state: RootState) => state.player.shuffle;

export default playerSlice.reducer;

setupPlayerListeners();
