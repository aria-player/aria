import { listenForAction, listenForChange } from "../../app/listener";
import { RootState } from "../../app/store";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectCurrentTrack } from "../sharedSelectors";
import { loadAndPlayTrack, selectStatus } from "./playerSlice";
import { Status } from "./playerTypes";
import { resetTimer, startTimer, stopTimer } from "./playerTime";
import { isAnyOf } from "@reduxjs/toolkit";

const getCurrentSource = (state: RootState): SourceHandle | null => {
  const currentTrack = selectCurrentTrack(state);
  if (!currentTrack) return null;
  return pluginHandles[currentTrack.source] as SourceHandle;
};

export function setupPlayerListeners() {
  listenForChange(
    (state) => state.player.status,
    (state) => {
      const currentSource = getCurrentSource(state);
      if (selectStatus(state) === Status.Playing) {
        currentSource?.resume();
        startTimer();
      } else if (selectStatus(state) === Status.Paused) {
        currentSource?.pause();
        stopTimer();
      }
    }
  );

  listenForAction(isAnyOf(loadAndPlayTrack.fulfilled), () => {
    resetTimer();
  });

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
