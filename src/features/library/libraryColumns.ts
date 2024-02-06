import { ColDef } from "@ag-grid-community/core";
import { Track } from "../tracks/tracksTypes";
import { formatBytes, formatDuration } from "../../app/utils";
import { plugins } from "../../plugins/plugins";

export const defaultColumnDefinitions: ColDef[] = [
  { field: "id", hide: true, filter: false },
  { field: "uri", hide: true, filter: false },
  {
    field: "title",
    flex: 1,
    cellStyle: (params: { data: Track }) => {
      return { fontStyle: params.data.metadataloaded ? "normal" : "italic" };
    }
  },
  {
    field: "duration",
    filter: false,
    valueFormatter: (params: { data: Track; value: number }) => {
      if (!params.data.metadataloaded) {
        return "-";
      }
      return formatDuration(params.value);
    }
  },
  {
    field: "artist",
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      if (Array.isArray(params.value)) {
        return params.value.join("/");
      }
      return params.value;
    }
  },
  { field: "albumartist" },
  {
    field: "album",
    cellStyle: (params: { data: Track }) => {
      return { fontStyle: params.data.metadataloaded ? "normal" : "italic" };
    }
  },
  { field: "genre" },
  { field: "year" },
  { field: "composer", hide: true },
  { field: "comments", hide: true },
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
    field: "datemodified",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number }) => {
      return new Date(params.value).toUTCString();
    }
  },
  {
    field: "dateadded",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number }) => {
      return new Date(params.value).toUTCString();
    }
  },
  {
    field: "filesize",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number }) => {
      return formatBytes(params.value);
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
