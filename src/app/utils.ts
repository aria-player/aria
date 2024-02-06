import { TrackUri, TrackId } from "../features/tracks/tracksTypes";
import { PluginId } from "../features/plugins/pluginsTypes";

interface Window {
  __TAURI__?: unknown;
}

export function isTauri() {
  return (window as Window).__TAURI__ !== undefined;
}

export function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 1000 / 60);
  const seconds = Math.floor((duration / 1000) % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

export function formatBytes(bytes: number) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, unit)).toFixed(2) + " " + sizes[unit];
}

export function getTrackId(source: PluginId, uri: TrackUri): TrackId {
  return source + ":" + uri;
}
