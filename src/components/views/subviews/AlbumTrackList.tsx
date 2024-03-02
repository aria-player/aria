import {
  ICellRendererParams,
  RowHeightParams,
  IRowNode,
  GridReadyEvent,
  RowDragEndEvent,
  RowDragLeaveEvent,
  RowDragMoveEvent,
  SelectionChangedEvent
} from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useCallback, useContext, useEffect } from "react";
import { Track } from "../../../features/tracks/tracksTypes";
import { nanoid } from "@reduxjs/toolkit";
import {
  selectCurrentTrack,
  selectVisibleTracks
} from "../../../features/sharedSelectors";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { AlbumTrackListRow } from "./AlbumTrackListRow";
import { GridContext } from "../../../contexts/GridContext";
import { PlaylistItem } from "../../../features/playlists/playlistsTypes";
import { t } from "i18next";
import { addTracksToPlaylist } from "../../../features/playlists/playlistsSlice";
import { setSelectedTracks } from "../../../features/tracks/tracksSlice";
import { useLocation } from "react-router-dom";
import { store } from "../../../app/store";
import { compareMetadata } from "../../../app/utils";
import { replace } from "redux-first-history";
import AlbumTrackListSeparator from "./AlbumTrackListSeparator";

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
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { gridRef } = useContext(GridContext);
  const visibleTracks = useAppSelector(selectVisibleTracks);

  const rowData = useMemo(() => {
    const processTracks = (tracks: Track[]) => {
      if (!tracks) return [];
      let currentAlbum: string | null = null;
      let currentDisc: number | null = null;
      let currentAlbumTracks = 0;
      const processedTracks: AlbumTrackListItem[] = [];
      visibleTracks
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
                artist: track.albumArtist,
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
  }, [visibleTracks]);

  useEffect(() => {
    gridRef?.current?.api?.resetRowHeights();
  }, [gridRef, visibleTracks]);

  // Duplicated functions from TrackList
  const handleSelectionChanged = (event: SelectionChangedEvent) => {
    dispatch(
      setSelectedTracks(
        event.api.getSelectedRows().map((node) => ({
          itemId: node.itemId,
          trackId: node.trackId
        }))
      )
    );
  };

  const focusCurrentIfNeeded = useCallback(() => {
    const currentTrack = selectCurrentTrack(store.getState());
    if (location.state?.focusCurrent && gridRef?.current?.api && currentTrack) {
      const row = gridRef.current.api.getRowNode(currentTrack.itemId);
      if (row != null && row.rowIndex != null) {
        gridRef.current.api.ensureIndexVisible(row.rowIndex, "middle");
        gridRef.current.api.deselectAll();
        gridRef.current.api.setNodesSelected({ nodes: [row], newValue: true });
        dispatch(replace(location.pathname, {}));
      }
    }
  }, [dispatch, gridRef, location.pathname, location.state?.focusCurrent]);

  useEffect(() => {
    focusCurrentIfNeeded();
  }, [focusCurrentIfNeeded, location]);

  const handleGridReady = (params: GridReadyEvent) => {
    focusCurrentIfNeeded();
    let lastHoveredItem: HTMLElement | null = null;
    const treeElement = document.querySelector('[role="tree"]') as HTMLElement;

    const setOutline = (
      element: Element | null | undefined,
      enabled: boolean
    ) => {
      if (element)
        (element as HTMLElement).style.outline = enabled
          ? "2px solid var(--accent-color)"
          : "none";
    };

    const updateDragGhost = (
      trackTitle: string,
      playlist: string | null | undefined
    ) => {
      const ghostLabel = document.querySelector(".ag-dnd-ghost-label");
      if (!ghostLabel) return;

      const selectedRowsCount = params.api.getSelectedRows().length ?? 0;
      ghostLabel.textContent = playlist
        ? selectedRowsCount <= 1
          ? t("tracks.addNamedTrackToPlaylist", {
              title: trackTitle,
              playlist
            })
          : t("tracks.addSelectedToPlaylist", {
              count: selectedRowsCount,
              playlist
            })
        : selectedRowsCount <= 1
          ? trackTitle
          : t("tracks.selectedCount", { count: selectedRowsCount });

      if (!playlist && lastHoveredItem) {
        setOutline(lastHoveredItem, false);
      }
    };

    const isPlaylist = (item: HTMLElement | null) => {
      return (
        item != null &&
        item.getAttribute("data-section") === "playlists" &&
        item.getAttribute("data-folder") != "true" &&
        item.getAttribute("data-item") != "header-playlists" &&
        item.getAttribute("data-item") != "playlists-empty"
      );
    };

    const getHoveredItem = (x: number, y: number) => {
      const targetElements = document.elementsFromPoint(x, y);
      const item = targetElements.find((element) =>
        element.matches('[data-section="playlists"]')
      ) as HTMLElement;
      setOutline(lastHoveredItem, false);
      if (!isPlaylist(item)) return null;

      setOutline(item.firstElementChild?.firstElementChild, true);
      lastHoveredItem = item.firstElementChild
        ?.firstElementChild as HTMLElement;
      return { id: item.getAttribute("data-item"), title: item.textContent };
    };

    const playlistDropZone = {
      getContainer: () => treeElement,

      onDragging: (params: RowDragMoveEvent) => {
        const item = getHoveredItem(params.event.clientX, params.event.clientY);
        updateDragGhost(params.node.data.title, item?.title);
      },

      onDragLeave: (params: RowDragLeaveEvent) => {
        updateDragGhost(params.node.data.title, null);
      },

      onDragStop: (params: RowDragEndEvent) => {
        updateDragGhost(params.node.data.title, null);
        const item = getHoveredItem(params.event.clientX, params.event.clientY);
        if (!item?.id) return;

        const selectedRowsCount = params.api.getSelectedRows().length ?? 0;
        let newTracks = [] as PlaylistItem[];
        if (selectedRowsCount <= 1) {
          newTracks = [
            {
              itemId: nanoid(),
              trackId: params.node.data.trackId
            }
          ];
        } else {
          newTracks = params.api
            .getSelectedRows()
            .map((node) => {
              return { itemId: nanoid(), trackId: node.trackId };
            })
            .filter(Boolean) as PlaylistItem[];
        }
        dispatch(
          addTracksToPlaylist({
            playlistId: item.id,
            newTracks
          })
        );
      }
    };

    params.api.addRowDropZone(playlistDropZone);
  };
  // End duplicated functions

  return (
    <div
      style={{ height: "100%" }}
      className={"ag-theme-balham ag-overrides-album-track-list"}
    >
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        getRowId={(params) => params.data.itemId}
        columnDefs={[]}
        getRowHeight={getRowHeight}
        isRowSelectable={isRowSelectable}
        fullWidthCellRenderer={fullWidthCellRenderer}
        onGridReady={handleGridReady}
        onSelectionChanged={handleSelectionChanged}
        isFullWidthRow={() => true}
        animateRows={false}
        headerHeight={0}
        rowHeight={48}
        overlayNoRowsTemplate={t("albumTrackList.empty")}
        rowSelection="multiple"
        suppressCellFocus
        rowDragMultiRow
        suppressScrollOnNewData
        preventDefaultOnContextMenu
        suppressHeaderFocus
        rowDragText={(params) =>
          params.rowNodes?.length == 1
            ? params.rowNode?.data.title
            : t("tracks.selectedCount", {
                count: params.rowNodes?.length
              })
        }
      />
    </div>
  );
};
