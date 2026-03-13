import { RootState, store } from "../../app/store";
import { selectCurrentTrack } from "../currentSelectors";
import {
  getSourceHandle,
  pluginHandles,
  selectActivePlugins,
  selectPluginInfo,
} from "../plugins/pluginsSlice";
import { nextTrack, previousTrack, selectRepeatMode } from "./playerSlice";
import { RepeatMode } from "./playerTypes";

let playing = false;
let lastStartPosition = 0;
let lastStartTimestamp = 0;

export function getElapsedPlayerTime() {
  return lastStartPosition + (playing ? Date.now() - lastStartTimestamp : 0);
}

export function startTimer() {
  lastStartTimestamp = Date.now();
  playing = true;
}

export function stopTimer() {
  lastStartPosition = getElapsedPlayerTime();
  playing = false;
}

export function resetTimer() {
  lastStartPosition = 0;
  lastStartTimestamp = Date.now();
}

export function seek(position: number) {
  lastStartPosition = position;
  lastStartTimestamp = Date.now();
  const state = store.getState() as RootState;
  const currentTrack = selectCurrentTrack(state);
  if (!currentTrack) return;

  const plugin = getSourceHandle(currentTrack.source);
  plugin?.setTime(position);

  const plugins = selectPluginInfo(state);
  const activePlugins = selectActivePlugins(state);
  for (const pluginId of activePlugins) {
    if (plugins[pluginId].capabilities?.includes("integration")) {
      try {
        pluginHandles[pluginId]?.onSeek?.(position, currentTrack.duration);
      } catch (e) {
        console.error(`Error invoking onSeek for ${pluginId}:`, e);
      }
    }
  }
}

export function restartOrPreviousTrack() {
  if (getElapsedPlayerTime() > 2000) {
    seek(0);
  } else {
    store.dispatch(previousTrack());
  }
}

export function restartOrNextTrack() {
  if (selectRepeatMode(store.getState()) == RepeatMode.One) {
    seek(0);
  } else {
    store.dispatch(nextTrack());
  }
}
