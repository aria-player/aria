import { RootState } from "../app/store";
import { selectTrackById } from "./library/librarySlice";

export const selectCurrentTrack = (state: RootState) => {
  if (state.player.queueIndex == null) {
    return null;
  }
  const currentTrackId = state.player.queue[state.player.queueIndex];
  if (currentTrackId == null) {
    return null;
  }
  return selectTrackById(state, currentTrackId);
};
