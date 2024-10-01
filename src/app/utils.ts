import { TrackUri, TrackId } from "../features/tracks/tracksTypes";
import { PluginId } from "../features/plugins/pluginsTypes";
import { ColumnState } from "@ag-grid-community/core";
import { defaultColumnDefinitions } from "../features/library/libraryColumns";
import i18n from "../i18n";
import { defaultPluginInfo } from "../plugins/plugins";

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

export function formatStringArray(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join("/") : (value ?? "");
}

export function formatBytes(bytes: number) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, unit)).toFixed(2) + " " + sizes[unit];
}

export function formatDate(date: number) {
  return new Date(date).toLocaleString(i18n.language, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function getTrackId(source: PluginId, uri: TrackUri): TrackId {
  return source + ":" + uri;
}

export function getStringIfFirst(value: string, index: number) {
  return index === 0 ? value : "";
}

export function filterHiddenColumnSort(columnState: ColumnState[]) {
  return columnState.map((column) => {
    return {
      ...column,
      sort: column.hide ? null : column?.sort,
      sortIndex: column.hide ? null : column?.sortIndex
    };
  });
}

export function overrideColumnStateSort(
  columnState: ColumnState[],
  sortedColumnState: ColumnState[] | null
) {
  return columnState.map((column) => {
    const overrideCol = sortedColumnState?.find(
      (overrideCol) => overrideCol.colId === column.colId
    );
    return {
      ...column,
      sort: column.hide ? null : overrideCol?.sort,
      sortIndex: column.hide ? null : overrideCol?.sortIndex
    };
  });
}

export function resetColumnStateExceptSort(columnState: ColumnState[] | null) {
  return defaultColumnDefinitions.map((colDef) => {
    const overrideCol = columnState?.find(
      (overrideCol) => overrideCol.colId === colDef.field
    );
    return {
      colId: colDef.field,
      sort: colDef.hide ? null : overrideCol?.sort,
      sortIndex: colDef.hide ? null : overrideCol?.sortIndex
    } as ColumnState;
  });
}

// See https://stackoverflow.com/questions/3942878/how-to-decide-font-color-in-white-or-black-depending-on-background-color
export function colorIsDark(accentColor: string, contrastThreshold = 2) {
  function getLuminance(r: number, g: number, b: number) {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }

  const color =
    accentColor.charAt(0) === "#" ? accentColor.substring(1, 7) : accentColor;
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);
  const contrastRatio = 1.05 / (getLuminance(r, g, b) + 0.05);
  return contrastRatio >= contrastThreshold;
}

export function sortDefaultPluginsFirst(a: PluginId, b: PluginId) {
  const defaultPlugins = Object.keys(defaultPluginInfo);
  const inDefaultA = defaultPlugins.includes(a) ? -1 : 1;
  const inDefaultB = defaultPlugins.includes(b) ? -1 : 1;
  return inDefaultA - inDefaultB;
}
