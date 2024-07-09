import { ColDef } from "@ag-grid-community/core";
import { Track, TrackListItem } from "../tracks/tracksTypes";
import {
  formatStringArray,
  formatBytes,
  formatDuration,
  formatDate
} from "../../app/utils";
import { plugins } from "../../plugins/plugins";
import { AlbumArt } from "../../components/views/subviews/AlbumArt";
import { createElement } from "react";

export const defaultColumnDefinitions: ColDef[] = [
  { field: "trackId", hide: true, filter: false },
  { field: "uri", hide: true, filter: false },
  {
    field: "art",
    headerValueGetter: () => "",
    resizable: false,
    sortable: false,
    suppressSizeToFit: true,
    suppressAutoSize: true,
    suppressMovable: true,
    lockPosition: true,
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    cellRenderer: (params: { data: TrackListItem }) => {
      return createElement(
        "div",
        {
          style: {
            width: "30px",
            height: "30px",
            borderRadius: "0.25rem",
            overflow: "hidden"
          }
        },
        AlbumArt({ track: params.data })
      );
    }
  },
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
        ? formatDate(params.value)
        : "";
    }
  },
  {
    field: "dateAdded",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? formatDate(params.value)
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
