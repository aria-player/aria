import { useContext, useEffect, useMemo } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import {
  CellContextMenuEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  GridReadyEvent,
  RowClassParams,
  RowClickedEvent,
  RowDragEndEvent,
  RowDragLeaveEvent,
  RowDragMoveEvent,
  SelectionChangedEvent
} from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectColumnState,
  setColumnState
} from "../../features/library/librarySlice";
import { defaultColumnDefinitions } from "../../features/library/libraryColumns";
import { selectQueueSource, setQueue } from "../../features/player/playerSlice";
import {
  selectCurrentTrack,
  selectVisiblePlaylist,
  selectVisibleTracks
} from "../../features/sharedSelectors";
import { GridContext } from "../../contexts/GridContext";
import { useTranslation } from "react-i18next";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { setSelectedTracks } from "../../features/tracks/tracksSlice";
import {
  addTracksToPlaylist,
  setPlaylistTracks
} from "../../features/playlists/playlistsSlice";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";
import { nanoid } from "@reduxjs/toolkit";
import { LibraryView } from "../../features/library/libraryTypes";

export const TrackList = () => {
  const dispatch = useAppDispatch();

  const currentTrack = useAppSelector(selectCurrentTrack);
  const rowData = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const queueSource = useAppSelector(selectQueueSource);
  const { gridRef } = useContext(GridContext);
  const { setMenuData } = useContext(MenuContext);
  const { show: showHeaderContextMenu } = useContextMenu({
    id: "tracklistheader"
  });
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem"
  });
  const visibleView = visiblePlaylist?.id ?? LibraryView.Songs;

  const { t } = useTranslation();
  const columnState = useAppSelector(selectColumnState);
  const columnDefs = useMemo(() => {
    if (!columnState) return defaultColumnDefinitions;

    const columnStateMap = Object.fromEntries(
      columnState.map((state) => [state.colId, state])
    );

    return defaultColumnDefinitions
      .map((colDef) => {
        const updatedColumnState = {
          ...columnStateMap[colDef.field as string]
        };
        delete updatedColumnState.rowGroup;
        delete updatedColumnState.pivot;
        return {
          ...colDef,
          ...updatedColumnState,
          headerName:
            colDef.field != "trackId" && colDef.field != "uri"
              ? t(`columns.${colDef.field}`)
              : colDef.field
        };
      })
      .sort((a, b) => {
        const indexA = columnState.findIndex(
          (state) => state.colId === a.field
        );
        const indexB = columnState.findIndex(
          (state) => state.colId === b.field
        );
        return indexA - indexB || 1;
      });
  }, [columnState, t]);

  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      lockPinned: true,
      flex: 0.3
    }),
    []
  );

  const updateColumnState = () => {
    if (gridRef?.current != null) {
      const colState = gridRef.current.columnApi.getColumnState();
      dispatch(setColumnState(colState));
    }
  };

  const handleCellDoubleClicked = (event: RowClickedEvent) => {
    if (gridRef?.current?.api) {
      const queue = [] as PlaylistItem[];
      gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
        queue.push({
          itemId: node.data.itemId,
          trackId: node.data.trackId
        });
      });
      dispatch(
        setQueue({
          queue,
          queueIndex: event.rowIndex ?? 0,
          queueSource: visibleView
        })
      );
    }
  };

  const handleSortChanged = () => {
    if (gridRef?.current?.api && queueSource == visibleView) {
      const queue = [] as PlaylistItem[];
      gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
        queue.push({
          itemId: node.data.itemId,
          trackId: node.data.trackId
        });
      });
      let queueIndex = null;
      if (currentTrack) {
        queueIndex = queue.findIndex(
          (item) => item.itemId === currentTrack.itemId
        );
      }
      dispatch(
        setQueue({
          queue,
          queueIndex,
          queueSource: visibleView
        })
      );
      updateColumnState();
    }
  };

  const handleColumnMovedOrResized = (
    params: ColumnMovedEvent | ColumnResizedEvent
  ) => {
    if (params.finished && params.column) {
      updateColumnState();
    }
  };

  useEffect(() => {
    if (gridRef?.current?.api) gridRef.current?.api.redrawRows();
  }, [gridRef, currentTrack]);

  useEffect(() => {
    const headerContextArea = document.querySelector(".ag-header");
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      showHeaderContextMenu({
        event: e as TriggerEvent
      });
    };

    if (headerContextArea) {
      headerContextArea.addEventListener("contextmenu", handleContextMenu);
    }
    return () => {
      if (headerContextArea) {
        headerContextArea.removeEventListener("contextmenu", handleContextMenu);
      }
    };
  }, [showHeaderContextMenu]);

  const handleCellContextMenu = (event: CellContextMenuEvent) => {
    if (!event.node.isSelected()) {
      event.node.setSelected(true, true);
    }
    if (event.node.id) {
      setMenuData({ itemId: event.node.id, type: "tracklistitem" });
    }
    showCellContextMenu({ event: event.event as TriggerEvent });
  };

  const handleSelectionChanged = (event: SelectionChangedEvent) => {
    dispatch(
      setSelectedTracks(event.api.getSelectedRows().map((node) => node.itemId))
    );
  };

  const handleRowDragEnd = (event: RowDragEndEvent) => {
    if (!visiblePlaylist?.id) return;
    const newOrder = [] as PlaylistItem[];
    event.api.forEachNode((node) => {
      if (node.data) {
        newOrder.push({
          itemId: node.data.itemId,
          trackId: node.data.trackId
        });
      }
    });
    dispatch(
      setPlaylistTracks({ playlistId: visiblePlaylist.id, tracks: newOrder })
    );
  };

  const handleGridReady = (params: GridReadyEvent) => {
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

      const selectedRowsCount =
        gridRef?.current?.api.getSelectedRows().length ?? 0;
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

        const selectedRowsCount =
          gridRef?.current?.api.getSelectedRows().length ?? 0;
        let newTracks = [] as PlaylistItem[];
        if (selectedRowsCount <= 1) {
          newTracks = [
            {
              itemId: nanoid(),
              trackId: params.node.data.trackId
            }
          ];
        } else {
          newTracks = gridRef?.current?.api
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

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
        ref={gridRef}
        getRowId={(params) => params.data.itemId}
        rowData={rowData}
        columnDefs={columnDefs as ColDef[]}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        onGridReady={handleGridReady}
        onCellDoubleClicked={handleCellDoubleClicked}
        onSortChanged={handleSortChanged}
        onColumnMoved={handleColumnMovedOrResized}
        onColumnResized={handleColumnMovedOrResized}
        onColumnVisible={updateColumnState}
        onCellContextMenu={handleCellContextMenu}
        onSelectionChanged={handleSelectionChanged}
        onRowDragEnd={handleRowDragEnd}
        rowHeight={33}
        headerHeight={37}
        suppressCellFocus
        rowDragMultiRow
        suppressDragLeaveHidesColumns
        suppressScrollOnNewData
        suppressMoveWhenRowDragging
        rowDragManaged={visiblePlaylist?.id != null}
        rowDragEntireRow
        alwaysShowVerticalScroll
        preventDefaultOnContextMenu
        getRowStyle={(params: RowClassParams) => {
          if (
            params.data.itemId === currentTrack?.itemId &&
            queueSource == visibleView
          ) {
            return { fontWeight: 700 };
          }
        }}
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
