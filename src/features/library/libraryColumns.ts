import { ColDef } from "@ag-grid-community/core";
import { Track } from "../tracks/tracksTypes";
import {
  formatStringArray,
  formatBytes,
  formatDuration
} from "../../app/utils";
import { plugins } from "../../plugins/plugins";

export const defaultColumnDefinitions: ColDef[] = [
  { field: "trackId", hide: true, filter: false },
  { field: "uri", hide: true, filter: false },
  {
    field: "title",
    flex: 1
  },
  {
    field: "duration",
    filter: false,
    valueFormatter: (params: { data: Track; value: number | null }) => {
      if (
        !params.data.metadataLoaded ||
        params.value == undefined ||
        params.value == null
      ) {
        return "-";
      }
      return formatDuration(params.value);
    }
  },
  {
    field: "artist",
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      return formatStringArray(params.value);
    }
  },
  { field: "albumArtist" },
  {
    field: "album"
  },
  {
    field: "genre",
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      return formatStringArray(params.value);
    }
  },
  { field: "year" },
  {
    field: "composer",
    hide: true,
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      return formatStringArray(params.value);
    }
  },
  {
    field: "comments",
    hide: true,
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      return formatStringArray(params.value);
    }
  },
  {
    field: "track",
    hide: true,
    filter: false,
    type: "rightAligned"
  },
  {
    field: "disc",
    hide: true,
    filter: false,
    type: "rightAligned"
  },
  {
    field: "dateModified",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? new Date(params.value).toUTCString()
        : "";
    }
  },
  {
    field: "dateAdded",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? new Date(params.value).toUTCString()
        : "";
    }
  },
  {
    field: "fileSize",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? formatBytes(params.value)
        : "";
    },
    type: "rightAligned"
  },
  {
    field: "source",
    hide: true,
    valueFormatter: (params: { value: string }) => {
      return plugins[params.value].name;
    }
  }
];
