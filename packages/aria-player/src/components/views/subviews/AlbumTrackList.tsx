import {
  BodyScrollEvent,
  ICellRendererParams,
  RowHeightParams
} from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect } from "react";
import { Track } from "../../../../../types/tracks";
import { useAppSelector } from "../../../app/hooks";
import { TrackSummaryRow } from "./TrackSummaryRow";
import { t } from "i18next";
import { getMostCommonArtworkUri } from "../../../app/utils";
import AlbumTrackListSeparator from "./AlbumTrackListSeparator";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { selectVisibleGroupFilteredTracks } from "../../../features/visibleSelectors";
import NoRowsOverlay from "./NoRowsOverlay";

export interface AlbumTrackListItem {
  itemId: string;
  separator?: boolean;
  title?: string;
  artist?: string | string[];
  artistUri?: string | string[];
  album?: string;
  albumId?: string;
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

export const AlbumTrackList = (props: {
  onBodyScroll?: (event: BodyScrollEvent) => void;
}) => {
  const { gridRef, gridProps } = useTrackGrid();
  const visibleTracks = useAppSelector(selectVisibleGroupFilteredTracks);

  const rowData = useMemo(() => {
    const processTracks = (tracks: Track[]) => {
      if (!tracks) return [];
      let currentAlbum: string | null = null;
      let currentDisc: number | null = null;
      let currentAlbumTracks = 0;
      let currentAlbumDiscs = 0;
      const processedTracks: AlbumTrackListItem[] = [];
      visibleTracks.forEach((track) => {
        if (track.albumId !== currentAlbum) {
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
            artist:
              track.albumArtist || track.artist || t("tracks.unknownArtist"),
            artistUri: track.albumArtistUri || track.artistUri || undefined,
            album: track.album || t("tracks.unknownAlbum"),
            albumId: track.albumId,
            year: track.year || undefined,
            artworkUri: getMostCommonArtworkUri(
              visibleTracks.filter((t) => t.albumId === track.albumId)
            ),
            source: track.source,
            separator: true,
            itemId: `album-header-${track.albumId}`
          });
          currentAlbum = track.albumId ?? null;
          currentAlbumDiscs = Math.max(
            ...visibleTracks
              .filter((t) => t.albumId === track.albumId)
              .map((t) => t.disc || 1)
          );
          currentDisc = null;
        }
        if (
          track.disc != null &&
          track.disc != undefined &&
          currentAlbumDiscs > 1 &&
          currentDisc !== track.disc
        ) {
          processedTracks.push({
            title: t("albumTrackList.disc", { number: track.disc }),
            separator: true,
            itemId: `disc-separator-${track.albumId}-${currentDisc}`
          });
        }
        processedTracks.push(track);
        currentDisc = track.disc ?? null;
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
        "album-track-list ag-theme-balham ag-overrides-track-summary-rows"
      }
    >
      <AgGridReact
        {...gridProps}
        ref={gridRef}
        rowData={rowData}
        columnDefs={[]}
        getRowHeight={getRowHeight}
        fullWidthCellRenderer={fullWidthCellRenderer}
        isFullWidthRow={() => true}
        headerHeight={0}
        rowHeight={48}
        noRowsOverlayComponent={NoRowsOverlay}
        onBodyScroll={props.onBodyScroll}
        suppressHeaderFocus
      />
    </div>
  );
};
