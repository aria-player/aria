import {
  ICellRendererParams,
  RowHeightParams,
  IRowNode
} from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect } from "react";
import { Track } from "../../../features/tracks/tracksTypes";
import { useAppSelector } from "../../../app/hooks";
import { TrackSummaryRow } from "./TrackSummaryRow";
import { t } from "i18next";
import { formatStringArray } from "../../../app/utils";
import AlbumTrackListSeparator from "./AlbumTrackListSeparator";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { selectVisibleGroupFilteredTracks } from "../../../features/visibleSelectors";
import NoRowsOverlay from "./NoRowsOverlay";

export interface AlbumTrackListItem {
  itemId: string;
  separator?: boolean;
  title?: string;
  artist?: string | string[];
  album?: string;
  year?: number;
  artworkUri?: string;
  tracks?: number;
  source?: string;
}

const fullWidthCellRenderer = (params: ICellRendererParams) => {
  return params.data.separator ? (
    <AlbumTrackListSeparator {...params} />
  ) : (
    <TrackSummaryRow {...params} />
  );
};

const isRowSelectable = (node: IRowNode) => !node.data.separator;

const getRowHeight = (params: RowHeightParams) => {
  if (params.data.separator) {
    if (!params.data.album) {
      if (params.data.tracks > 4) {
        return 24;
      } else {
        return 24 + 48 * (5 - params.data.tracks);
      }
    }
    return 96;
  }
};

export const AlbumTrackList = () => {
  const { gridRef, gridProps } = useTrackGrid();
  const visibleTracks = useAppSelector(selectVisibleGroupFilteredTracks);

  const rowData = useMemo(() => {
    const processTracks = (tracks: Track[]) => {
      if (!tracks) return [];
      let currentAlbum: string | null = null;
      let currentDisc: number | null = null;
      let currentAlbumTracks = 0;
      const processedTracks: AlbumTrackListItem[] = [];
      visibleTracks.forEach((track) => {
        if (
          track.disc != null &&
          track.disc != undefined &&
          currentDisc !== track.disc &&
          currentAlbum == track.albumId
        ) {
          processedTracks.push({
            title: t("albumTrackList.disc", { number: track.disc }),
            separator: true,
            itemId: `disc-separator-${track.albumId}-${currentDisc}`
          });
        }

        currentDisc = track.disc ?? null;
        if (currentAlbum !== track.albumId) {
          if (currentAlbum !== null) {
            processedTracks.push({
              separator: true,
              tracks: currentAlbumTracks,
              source: track.source,
              itemId: `album-separator-${track.albumId}`
            });
            currentAlbumTracks = 0;
          }
          processedTracks.push({
            artist: track.albumArtist ?? formatStringArray(track.artist),
            album: track.album,
            year: track.year,
            artworkUri: track.artworkUri,
            source: track.source,
            separator: true,
            itemId: `album-header-${track.albumId}-`
          });
          currentAlbum = track.albumId ?? null;
        }
        processedTracks.push(track);
        currentAlbumTracks += 1;
      });
      if (visibleTracks.length > 0)
        processedTracks.push({
          separator: true,
          tracks: currentAlbumTracks,
          itemId: `album-separator`
        });
      return processedTracks;
    };
    return processTracks(visibleTracks as Track[]);
  }, [visibleTracks]);

  useEffect(() => {
    gridRef?.current?.api?.resetRowHeights();
  }, [gridRef, visibleTracks]);

  return (
    <div
      style={{ height: "100%" }}
      className={
        "ag-theme-balham ag-overrides-track-summary-rows ag-overrides-album-track-list"
      }
    >
      <AgGridReact
        {...gridProps}
        ref={gridRef}
        rowData={rowData}
        columnDefs={[]}
        getRowHeight={getRowHeight}
        isRowSelectable={isRowSelectable}
        fullWidthCellRenderer={fullWidthCellRenderer}
        isFullWidthRow={() => true}
        headerHeight={0}
        rowHeight={48}
        noRowsOverlayComponent={NoRowsOverlay}
        suppressHeaderFocus
      />
    </div>
  );
};
