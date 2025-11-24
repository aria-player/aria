import { PluginId } from "../../../types/plugins";
import { ColumnState } from "@ag-grid-community/core";
import { defaultColumnDefinitions } from "../features/library/libraryColumns";
import i18n from "../i18n";
import { defaultPluginInfo } from "../plugins/plugins";
import {
  ArtistUri,
  ArtistId,
  Track,
  TrackId,
  TrackUri,
  AlbumUri,
  AlbumId
} from "../../../types";
import { BASEPATH } from "./constants";

interface Window {
  __TAURI_INTERNALS__?: unknown;
}

export function isTauri() {
  return (window as Window).__TAURI_INTERNALS__ !== undefined;
}

export function getRelativePath(pathname: string) {
  return pathname.startsWith(BASEPATH)
    ? pathname.slice(BASEPATH.length)
    : pathname;
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

export function formatSampleRate(sampleRate: number) {
  return sampleRate >= 1000
    ? `${(sampleRate / 1000).toString()} kHz`
    : `${sampleRate} Hz`;
}

export function formatBitRate(bitRate: number) {
  return bitRate >= 1000
    ? `${(bitRate / 1000).toFixed(0)} kbps`
    : `${bitRate} bps`;
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

export function getArtistId(source: PluginId, uri: ArtistUri): ArtistId {
  return source + ":" + uri;
}

export function getAlbumId(
  source: PluginId,
  album: string,
  albumArtist?: string | string[],
  uri?: AlbumUri
): AlbumId {
  return source + ":" + (uri ?? `${album}${getAsArray(albumArtist).join("-")}`);
}

export function getMostCommonArtworkUri(albumTracks: Track[]) {
  const artworkUriCount: { [key: string]: number } = {};
  albumTracks.forEach((track) => {
    if (track.artworkUri) {
      artworkUriCount[track.artworkUri] =
        (artworkUriCount[track.artworkUri] || 0) + 1;
    }
  });
  const keys = Object.keys(artworkUriCount);
  if (keys.length === 0) return;
  return keys.reduce((a, b) =>
    artworkUriCount[a] > artworkUriCount[b] ? a : b
  );
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

export function sortPlugins(a: PluginId, b: PluginId) {
  const localFilePlugins = ["tauri-player", "web-player"];
  const defaultPlugins = Object.keys(defaultPluginInfo);

  const getPriority = (plugin: PluginId) => {
    if (localFilePlugins.includes(plugin)) return 0;
    if (defaultPlugins.includes(plugin)) return 1;
    return 2;
  };

  const priorityDiff = getPriority(a) - getPriority(b);
  return priorityDiff !== 0 ? priorityDiff : a.localeCompare(b);
}

// From https://stackoverflow.com/questions/13382516/getting-scroll-bar-width-using-javascript
export function getScrollbarWidth() {
  const outer = document.createElement("div");
  outer.style.visibility = "hidden";
  outer.style.overflow = "scroll";
  document.body.appendChild(outer);
  const inner = document.createElement("div");
  outer.appendChild(inner);
  const scrollbarWidth = outer.offsetWidth - inner.offsetWidth;
  outer.parentNode?.removeChild(outer);
  return scrollbarWidth;
}

export function checkCompatibility(formatVersion: string, version?: string) {
  if (!version) return true;
  const versionParts = version.split(".");
  if (versionParts.length < 2) {
    return true;
  }
  const majorVersion = parseInt(versionParts[0], 10);
  const minorVersion = parseInt(versionParts[1], 10);
  const formatMajorVersion = parseInt(formatVersion.split(".")[0], 10);
  const formatMinorVersion = parseInt(formatVersion.split(".")[1], 10);
  if (majorVersion == 0 && formatMajorVersion == 0) {
    return minorVersion == formatMinorVersion;
  }
  return (
    majorVersion == formatMajorVersion && minorVersion <= formatMinorVersion
  );
}

export function getAsArray(value: string | string[] | undefined | null) {
  if (value == null || value == undefined) return [];
  return Array.isArray(value) ? value : [value];
}

export function normalizeArtists(
  names: string | string[] | undefined | null,
  uris: string | string[] | undefined | null,
  source?: PluginId,
  delimiter?: string
): { id: ArtistId; name: string; uri?: ArtistUri }[] {
  const nameArray = getAsArray(names);
  const uriArray = getAsArray(uris);

  if (delimiter && nameArray.length === 1 && uriArray.length === 0) {
    const splitNames = nameArray[0]
      .split(delimiter)
      .map((s) => s.trim())
      .filter((s) => s);

    return splitNames.map((name) => {
      return { id: name, name };
    });
  }
  return nameArray.map((name, index) => {
    const uri = uriArray[index];
    const id = uri && source ? getArtistId(source, uri) : name;
    return { id, name, uri };
  });
}
