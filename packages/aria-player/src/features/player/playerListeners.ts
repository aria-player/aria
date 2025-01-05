import { listenForAction, listenForChange } from "../../app/listener";
import { RootState } from "../../app/store";
import {
  getSourceHandle,
  pluginHandles,
  selectActivePlugins,
  selectPluginInfo
} from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { loadAndPlayTrack, selectStatus } from "./playerSlice";
import { Status } from "./playerTypes";
import { resetTimer, startTimer, stopTimer } from "./playerTime";
import { isAnyOf } from "@reduxjs/toolkit";
import {
  selectCurrentTrack,
  selectCurrentTrackItemId
} from "../currentSelectors";

const getCurrentSource = (state: RootState): SourceHandle | undefined => {
  const currentTrack = selectCurrentTrack(state);
  if (currentTrack) {
    return getSourceHandle(currentTrack.source);
  }
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
          plugin != selectCurrentTrack(state)?.source
        ) {
          try {
            getSourceHandle(plugin)?.pause();
          } catch (e) {
            console.error(`Error pausing ${plugin}:`, e);
          }
        }
      });
      if (state.player.currentTrack != null) {
        dispatch(loadAndPlayTrack(state.player.currentTrack.trackId));
      }
      const currentTrack = selectCurrentTrack(state);
      if (!currentTrack) return;
      const plugins = selectPluginInfo(state);
      const artwork =
        await getCurrentSource(state)?.getTrackArtwork?.(currentTrack);
      for (const plugin of activePlugins) {
        if (plugins[plugin].capabilities?.includes("integration")) {
          try {
            pluginHandles[plugin]?.onPlay?.(currentTrack, artwork);
          } catch (e) {
            console.error(`Error invoking onPlay for ${plugin}:`, e);
          }
        }
      }
    }
  );

  listenForChange(
    (state) => state.player.status,
    (state) => {
      const currentSource = getCurrentSource(state);
      const status = selectStatus(state);
      const plugins = selectPluginInfo(state);
      const activePlugins = selectActivePlugins(state);
      if (status === Status.Playing) {
        currentSource?.resume();
        startTimer();
        for (const plugin of activePlugins) {
          if (plugins[plugin].capabilities?.includes("integration")) {
            try {
              pluginHandles[plugin]?.onResume?.();
            } catch (e) {
              console.error(`Error invoking onResume for ${plugin}:`, e);
            }
          }
        }
      } else if (status === Status.Paused) {
        currentSource?.pause();
        stopTimer();
        for (const plugin of activePlugins) {
          if (plugins[plugin].capabilities?.includes("integration")) {
            try {
              pluginHandles[plugin]?.onPause?.();
            } catch (e) {
              console.error(`Error invoking onPause for ${plugin}:`, e);
            }
          }
        }
      } else if (status === Status.Stopped) {
        stopTimer();
        resetTimer();
        for (const plugin of activePlugins) {
          getSourceHandle(plugin)?.pause();
          if (plugins[plugin].capabilities?.includes("integration")) {
            try {
              pluginHandles[plugin]?.onStop?.();
            } catch (e) {
              console.error(`Error invoking onStop for ${plugin}:`, e);
            }
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
