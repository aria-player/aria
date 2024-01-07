import { startListening } from "../../app/listener";
import { RootState } from "../../app/store";
import { selectTrackById } from "../library/librarySlice";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectCurrentTrackId, selectStatus } from "./playerSlice";
import { Status } from "./playerTypes";

const getPlayingSource = (state: RootState): SourceHandle | null => {
  const currentTrackId = selectCurrentTrackId(state);
  if (!currentTrackId) return null;
  const currentTrack = selectTrackById(state, currentTrackId);
  if (!currentTrack) return null;
  return pluginHandles[currentTrack.source] as SourceHandle;
};

export const setupPlayerListeners = () => {
  startListening({
    predicate: (_action, currentState: RootState, previousState: RootState) => {
      return currentState.player.status !== previousState.player.status;
    },
    effect: (_action, api) => {
      const state = api.getState();
      const currentSource = getPlayingSource(state);
      const status = selectStatus(state);
      if (status === Status.Playing) {
        currentSource?.resume();
      } else {
        currentSource?.pause();
      }
    }
  });
};
