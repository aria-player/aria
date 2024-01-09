import { ColDef } from "@ag-grid-community/core";
import { Track } from "./libraryTypes";
import { formatBytes, formatDuration } from "../../app/utils";
import { plugins } from "../../plugins/plugins";

export const columnDefinitions: ColDef[] = [
  { field: "id", hide: true, filter: false },
  { field: "uri", hide: true, filter: false },
  {
    field: "title",
    headerName: "Title",
    flex: 1,
    cellStyle: (params: { data: Track }) => {
      return { fontStyle: params.data.metadataloaded ? "normal" : "italic" };
    }
  },
  {
    field: "duration",
    headerName: "Duration",
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
    headerName: "Artist",
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      if (Array.isArray(params.value)) {
        return params.value.join("/");
      }
      return params.value;
    }
  },
  { field: "albumartist", headerName: "Album Artist" },
  {
    field: "album",
    headerName: "Album",
    cellStyle: (params: { data: Track }) => {
      return { fontStyle: params.data.metadataloaded ? "normal" : "italic" };
    }
  },
  { field: "genre", headerName: "Genre" },
  { field: "year", headerName: "Year" },
  { field: "composer", headerName: "Composer", hide: false },
  { field: "comments", headerName: "Comments", hide: false },
  {
    field: "track",
    headerName: "Track #",
    hide: false,
    filter: false,
    type: "rightAligned"
  },
  {
    field: "disc",
    headerName: "Disc #",
    hide: false,
    filter: false,
    type: "rightAligned"
  },
  {
    field: "datemodified",
    headerName: "Date Modified",
    hide: false,
    filter: false,
    valueFormatter: (params: { value: number }) => {
      return new Date(params.value).toUTCString();
    }
  },
  {
    field: "dateadded",
    headerName: "Date Added",
    hide: false,
    filter: false,
    valueFormatter: (params: { value: number }) => {
      return new Date(params.value).toUTCString();
    }
  },
  {
    field: "filesize",
    headerName: "Size",
    hide: false,
    filter: false,
    valueFormatter: (params: { value: number }) => {
      return formatBytes(params.value);
    },
    type: "rightAligned"
  },
  {
    field: "source",
    headerName: "Source",
    hide: false,
    valueFormatter: (params: { value: string }) => {
      return plugins[params.value].name;
    }
  }
];
