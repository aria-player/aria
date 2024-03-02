import {
  SelectionChangedEvent,
  GridReadyEvent,
  RowDragMoveEvent,
  RowDragLeaveEvent,
  RowDragEndEvent,
  GetRowIdParams,
  IRowDragItem
} from "@ag-grid-community/core";
import { nanoid } from "@reduxjs/toolkit";
import { t } from "i18next";
import { useCallback, useContext, useEffect } from "react";
import { replace } from "redux-first-history";
import { store } from "../app/store";
import { addTracksToPlaylist } from "../features/playlists/playlistsSlice";
import { PlaylistItem } from "../features/playlists/playlistsTypes";
import { selectCurrentTrack } from "../features/sharedSelectors";
import { setSelectedTracks } from "../features/tracks/tracksSlice";
import { useAppDispatch } from "../app/hooks";
import { GridContext } from "../contexts/GridContext";
import { useLocation } from "react-router-dom";
import { AgGridReactProps } from "@ag-grid-community/react";

export function useTrackGrid() {
  const dispatch = useAppDispatch();
  const { gridRef } = useContext(GridContext);
  const location = useLocation();

  const getRowId = (params: GetRowIdParams) => params.data.itemId;

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

  const rowDragText = (params: IRowDragItem) =>
    params.rowNodes?.length == 1
      ? params.rowNode?.data.title
      : t("tracks.selectedCount", {
          count: params.rowNodes?.length
        });

  const gridProps: Partial<AgGridReactProps> = {
    getRowId,
    onGridReady: handleGridReady,
    onSelectionChanged: handleSelectionChanged,
    rowDragText,
    rowSelection: "multiple",
    animateRows: false,
    suppressCellFocus: true,
    rowDragMultiRow: true,
    suppressScrollOnNewData: true,
    preventDefaultOnContextMenu: true,
    alwaysShowVerticalScroll: true
  };

  return {
    gridRef,
    gridProps
  };
}
