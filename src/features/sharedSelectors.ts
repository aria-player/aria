import { RootState } from "../app/store";
import { selectTrackById } from "./library/librarySlice";

export const selectCurrentTrack = (state: RootState) => {
  const currentTrackId = state.player.currentTrackId;
  if (currentTrackId == null) {
    return null;
  }
  return selectTrackById(state, currentTrackId);
};
