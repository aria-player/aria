import {
  ICellRendererParams,
  RowHeightParams,
  IRowNode
} from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect } from "react";
import { Track } from "../../../features/tracks/tracksTypes";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylistConfig,
  selectVisibleSelectedTrackGroup,
  selectVisibleTracks
} from "../../../features/sharedSelectors";
import { useAppSelector } from "../../../app/hooks";
import { AlbumTrackListRow } from "./AlbumTrackListRow";
import { t } from "i18next";
import { compareMetadata, formatArtist } from "../../../app/utils";
import AlbumTrackListSeparator from "./AlbumTrackListSeparator";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { DisplayMode, TrackGrouping } from "../../../app/view";

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
    <AlbumTrackListRow {...params} />
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
  const visibleTracks = useAppSelector(selectVisibleTracks);
  const selectedTrackGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const customGroup = useAppSelector(
    selectVisiblePlaylistConfig
  )?.trackGrouping;
  const trackGrouping =
    customGroup && visibleDisplayMode == DisplayMode.SplitView
      ? customGroup
      : TrackGrouping.Album;

  const rowData = useMemo(() => {
    const processTracks = (tracks: Track[]) => {
      if (!tracks) return [];
      let currentAlbum: string | null = null;
      let currentDisc: number | null = null;
      let currentAlbumTracks = 0;
      const processedTracks: AlbumTrackListItem[] = [];
      trackGrouping &&
        visibleTracks
          .filter(
            (track) =>
              track[trackGrouping] == selectedTrackGroup ||
              (selectedTrackGroup &&
                Array.isArray(track[trackGrouping]) &&
                (track[trackGrouping] as string[])?.includes(
                  selectedTrackGroup
                ))
          )
          .sort((a, b) => compareMetadata(a.track, b.track))
          .sort((a, b) => compareMetadata(a.disc, b.disc))
          .sort((a, b) => compareMetadata(a.album, b.album))
          .forEach((track) => {
            if (
              track.disc != null &&
              track.disc != undefined &&
              currentDisc !== track.disc &&
              currentAlbum == track.album
            ) {
              processedTracks.push({
                title: t("albumTrackList.disc", { number: track.disc }),
                separator: true,
                itemId: `disc-separator-${track.album}-${currentDisc}`
              });
            }

            currentDisc = track.disc ?? null;
            if (currentAlbum !== track.album) {
              if (currentAlbum !== track.album) {
                if (currentAlbum !== null) {
                  processedTracks.push({
                    separator: true,
                    tracks: currentAlbumTracks,
                    source: track.source,
                    itemId: `album-separator-${track.album}`
                  });
                  currentAlbumTracks = 0;
                }
                processedTracks.push({
                  artist: track.albumArtist ?? formatArtist(track.artist),
                  album: track.album,
                  year: track.year,
                  artworkUri: track.artworkUri,
                  source: track.source,
                  separator: true,
                  itemId: `album-header-${track.album}-`
                });
                currentAlbum = track.album ?? null;
              }
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
  }, [selectedTrackGroup, trackGrouping, visibleTracks]);

  useEffect(() => {
    gridRef?.current?.api?.resetRowHeights();
  }, [gridRef, visibleTracks]);

  return (
    <div
      style={{ height: "100%" }}
      className={"ag-theme-balham ag-overrides-album-track-list"}
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
        overlayNoRowsTemplate={t("albumTrackList.empty")}
        suppressHeaderFocus
      />
    </div>
  );
};
