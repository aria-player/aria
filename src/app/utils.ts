import { TrackUri, TrackId } from "../features/tracks/tracksTypes";
import { PluginId } from "../features/plugins/pluginsTypes";
import { ColumnState } from "@ag-grid-community/core";
import { defaultColumnDefinitions } from "../features/library/libraryColumns";

interface Window {
  __TAURI__?: unknown;
}

const sortCache: { [key: string]: number } = {};

export function isTauri() {
  return (window as Window).__TAURI__ !== undefined;
}

export function formatDuration(duration: number) {
  const minutes = Math.floor(duration / 1000 / 60);
  const seconds = Math.floor((duration / 1000) % 60);
  return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}

export function formatStringArray(value: string | string[] | undefined) {
  return Array.isArray(value) ? value.join("/") : value ?? "";
}

export function formatBytes(bytes: number) {
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, unit)).toFixed(2) + " " + sizes[unit];
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

export const compareMetadata = (
  valueA: string[] | string | number | boolean | undefined,
  valueB: string[] | string | number | boolean | undefined,
  isDescending?: boolean
): number => {
  const order = isDescending ? -1 : 1;
  const cacheKey = `${valueA}-${valueB}`;
  if (sortCache[cacheKey] !== undefined) return sortCache[cacheKey] * order;

  if (valueA == null && valueB == null) return (sortCache[cacheKey] = 0);
  if (valueA == null) return (sortCache[cacheKey] = 1 * order);
  if (valueB == null) return (sortCache[cacheKey] = -1 * order);

  if (Array.isArray(valueA)) valueA = valueA.length > 0 ? valueA[0] : "";
  if (Array.isArray(valueB)) valueB = valueB.length > 0 ? valueB[0] : "";

  if (typeof valueA === "string" && typeof valueB === "string") {
    return (sortCache[cacheKey] =
      valueA.localeCompare(valueB, undefined, {
        sensitivity: "base",
        ignorePunctuation: true
      }) * order);
  }

  if (typeof valueA === "number" && typeof valueB === "number") {
    return (sortCache[cacheKey] = (valueA - valueB) * order);
  }

  return (sortCache[cacheKey] = 0);
};
