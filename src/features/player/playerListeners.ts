import { startListening } from "../../app/listener";
import { RootState } from "../../app/store";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectCurrentTrack } from "../sharedSelectors";
import { selectStatus } from "./playerSlice";
import { Status } from "./playerTypes";

const getPlayingSource = (state: RootState): SourceHandle | null => {
  const currentTrack = selectCurrentTrack(state);
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

  startListening({
    predicate: (_action, currentState: RootState, previousState: RootState) => {
      return currentState.player.volume !== previousState.player.volume;
    },
    effect: (_action, api) => {
      const state = api.getState();
      getPlayingSource(state)?.setVolume(state.player.volume);
    }
  });

  startListening({
    predicate: (_action, currentState: RootState, previousState: RootState) => {
      return currentState.player.muted !== previousState.player.muted;
    },
    effect: (_action, api) => {
      const state = api.getState();
      getPlayingSource(state)?.setMuted(state.player.muted);
    }
  });
};
