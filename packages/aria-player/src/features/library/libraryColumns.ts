import { ColDef } from "@ag-grid-community/core";
import { TrackListItem } from "../tracks/tracksTypes";
import { Track } from "../../../../types/tracks";
import {
  formatStringArray,
  formatBytes,
  formatDuration,
  formatDate,
  formatSampleRate,
  formatBitRate
} from "../../app/utils";
import { AlbumArt } from "../../components/views/subviews/AlbumArt";
import { createElement } from "react";
import { getSourceHandle, selectPluginInfo } from "../plugins/pluginsSlice";
import { store } from "../../app/store";
import { t } from "i18next";

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
          className: "track-list-item-art",
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
    flex: 0.8,
    valueFormatter: (params: { data: Track; value: string | null }) => {
      if (params.data.uri == undefined) {
        return t("tracks.unknownTrack");
      }
      return params.value ?? "";
    }
  },
  {
    field: "duration",
    flex: 0.2,
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
    field: "albumArtist",
    hide: true,
    valueFormatter: (params: { data: Track; value: string | string[] }) => {
      return formatStringArray(params.value);
    }
  },
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
    field: "dateModified",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? formatDate(params.value)
        : "";
    }
  },
  { field: "filePath", hide: true },
  { field: "fileFolder", hide: true },
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
  { field: "fileFormat", hide: true, filter: false },
  {
    field: "sampleRate",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? formatSampleRate(params.value)
        : "";
    },
    type: "rightAligned"
  },
  {
    field: "bitRate",
    hide: true,
    filter: false,
    valueFormatter: (params: { value: number | null }) => {
      return params.value !== undefined && params.value !== null
        ? formatBitRate(params.value)
        : "";
    },
    type: "rightAligned"
  },
  {
    field: "source",
    hide: true,
    valueFormatter: (params: { value: string }) => {
      return (
        getSourceHandle(params.value)?.displayName ??
        selectPluginInfo(store.getState())[params.value]?.name
      );
    }
  },
  {
    field: "attribution",
    headerValueGetter: () => "",
    resizable: false,
    sortable: false,
    suppressSizeToFit: true,
    suppressAutoSize: true,
    suppressMovable: true,
    lockPosition: "right",
    width: 50,
    minWidth: 50,
    maxWidth: 50,
    cellRenderer: (params: { data: TrackListItem }) => {
      return createElement(
        "div",
        {
          style: {
            marginTop: "5px",
            height: "30px",
            borderRadius: "0.25rem",
            overflow: "hidden"
          }
        },
        createElement(() =>
          getSourceHandle(params.data.source)?.Attribution?.({
            type: "track",
            id: params.data.uri,
            compact: true
          })
        )
      );
    }
  }
];
