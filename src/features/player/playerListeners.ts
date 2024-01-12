import { listenForAction, listenForChange } from "../../app/listener";
import { RootState } from "../../app/store";
import { pluginHandles, selectActivePlugins } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectCurrentTrack } from "../sharedSelectors";
import {
  loadAndPlayTrack,
  nextTrack,
  previousTrack,
  selectStatus,
  setQueue
} from "./playerSlice";
import { Status } from "./playerTypes";
import { resetTimer, startTimer, stopTimer } from "./playerTime";
import { isAnyOf } from "@reduxjs/toolkit";
import { plugins } from "../../plugins/plugins";

const getCurrentSource = (state: RootState): SourceHandle | null => {
  const currentTrack = selectCurrentTrack(state);
  if (!currentTrack) return null;
  return pluginHandles[currentTrack.source] as SourceHandle;
};

export function setupPlayerListeners() {
  listenForAction(
    isAnyOf(previousTrack, nextTrack, setQueue),
    (state, _action, dispatch) => {
      stopTimer();
      resetTimer();
      if (state.player.queueIndex != null) {
        dispatch(loadAndPlayTrack(state.player.queue[state.player.queueIndex]));
      }
    }
  );

  listenForAction(isAnyOf(loadAndPlayTrack.fulfilled), () => {
    startTimer();
  });

  listenForChange(
    (state) => state.player.status,
    (state) => {
      const currentSource = getCurrentSource(state);
      const status = selectStatus(state);
      const activePlugins = selectActivePlugins(state);
      if (status === Status.Playing) {
        currentSource?.resume();
        startTimer();
      } else if (status === Status.Paused) {
        currentSource?.pause();
        stopTimer();
      } else if (status === Status.Stopped) {
        stopTimer();
        resetTimer();
        for (const plugin of activePlugins) {
          if (plugins[plugin].type === "source") {
            (pluginHandles[plugin] as SourceHandle).pause();
          }
        }
      }
    }
  );

  listenForChange(
    (state) => state.player.volume,
    (state) => {
      getCurrentSource(state)?.setVolume(state.player.volume);
    }
  );

  listenForChange(
    (state) => state.player.muted,
    (state) => {
      getCurrentSource(state)?.setMuted(state.player.muted);
    }
  );
}