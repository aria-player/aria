import { listenForAction, listenForChange } from "../../app/listener";
import { RootState } from "../../app/store";
import { pluginHandles, selectActivePlugins } from "../plugins/pluginsSlice";
import { IntegrationHandle, SourceHandle } from "../plugins/pluginsTypes";

import { loadAndPlayTrack, selectStatus } from "./playerSlice";
import { Status } from "./playerTypes";
import { resetTimer, startTimer, stopTimer } from "./playerTime";
import { isAnyOf } from "@reduxjs/toolkit";
import { plugins } from "../../plugins/plugins";
import {
  selectCurrentTrack,
  selectCurrentTrackItemId
} from "../currentSelectors";

const getCurrentSource = (state: RootState): SourceHandle | null => {
  const currentTrack = selectCurrentTrack(state);
  if (!currentTrack) return null;
  return pluginHandles[currentTrack.source] as SourceHandle;
};

export function setupPlayerListeners() {
  listenForAction(isAnyOf(loadAndPlayTrack.fulfilled), () => {
    startTimer();
  });

  listenForChange(
    (state) => selectCurrentTrackItemId(state),
    async (state, _action, dispatch) => {
      stopTimer();
      resetTimer();
      const activePlugins = selectActivePlugins(state);
      Object.keys(pluginHandles).forEach((plugin) => {
        if (
          activePlugins.includes(plugin) &&
          plugin != selectCurrentTrack(state)?.source &&
          plugins[plugin].type == "source"
        ) {
          (pluginHandles[plugin] as SourceHandle)?.pause();
        }
      });
      if (state.player.currentTrack != null) {
        dispatch(loadAndPlayTrack(state.player.currentTrack.trackId));
      }
      const currentTrack = selectCurrentTrack(state);
      if (!currentTrack) return;
      const artwork = await (
        pluginHandles[currentTrack?.source] as SourceHandle
      )?.getTrackArtwork?.(currentTrack);
      for (const plugin of activePlugins) {
        if (["integration", "source"].includes(plugins[plugin].type)) {
          (pluginHandles[plugin] as IntegrationHandle)?.onPlay?.(
            currentTrack,
            artwork
          );
        }
      }
    }
  );

  listenForChange(
    (state) => state.player.status,
    (state) => {
      const currentSource = getCurrentSource(state);
      const status = selectStatus(state);
      const activePlugins = selectActivePlugins(state);
      if (status === Status.Playing) {
        currentSource?.resume();
        startTimer();
        for (const plugin of activePlugins) {
          if (["integration", "source"].includes(plugins[plugin].type)) {
            (pluginHandles[plugin] as IntegrationHandle)?.onResume?.();
          }
        }
      } else if (status === Status.Paused) {
        currentSource?.pause();
        stopTimer();
        for (const plugin of activePlugins) {
          if (["integration", "source"].includes(plugins[plugin].type)) {
            (pluginHandles[plugin] as IntegrationHandle)?.onPause?.();
          }
        }
      } else if (status === Status.Stopped) {
        stopTimer();
        resetTimer();
        for (const plugin of activePlugins) {
          if (plugins[plugin].type === "source") {
            (pluginHandles[plugin] as SourceHandle)?.pause();
          }
          if (["integration", "source"].includes(plugins[plugin].type)) {
            (pluginHandles[plugin] as IntegrationHandle)?.onStop?.();
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
