import { RootState, store } from "../../app/store";
import { selectCurrentTrack } from "../currentSelectors";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { previousTrack } from "./playerSlice";

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
  const currentTrack = selectCurrentTrack(store.getState() as RootState);
  if (!currentTrack) return;
  const plugin = pluginHandles[currentTrack.source] as SourceHandle;
  plugin?.setTime(position);
  // In case the player automatically pauses at the end of a track
  if (playing) {
    plugin?.resume();
  }
}

export function restartOrPreviousTrack() {
  if (getElapsedPlayerTime() > 2000) {
    seek(0);
  } else {
    store.dispatch(previousTrack());
  }
}
