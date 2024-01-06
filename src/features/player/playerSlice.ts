import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Status } from "./playerTypes";
import { TrackId } from "../library/libraryTypes";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectTrackById } from "../library/librarySlice";

interface PlayerState {
  status: Status;
  currentTrackId: TrackId | null;
}

const initialState: PlayerState = {
  status: Status.Stopped,
  currentTrackId: null
};

export const loadAndPlayTrack = createAsyncThunk(
  "player/loadAndPlayTrack",
  async (id: TrackId, { dispatch, getState }) => {
    const track = selectTrackById(getState() as RootState, id);
    if (!track) {
      throw new Error("Track not found");
    }
    const plugin = pluginHandles[track?.source] as SourceHandle;
    await plugin.loadAndPlayTrack(track);
    dispatch(playTrack(id));
  }
);

export const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    playTrack: (state, action: PayloadAction<TrackId | null>) => {
      state.status = Status.Playing;
      state.currentTrackId = action.payload;
    }
  }
});

export const { playTrack } = playerSlice.actions;

export const selectStatus = (state: RootState) => state.player.status;
export const selectCurrentTrackId = (state: RootState) =>
  state.player.currentTrackId;

export default playerSlice.reducer;
