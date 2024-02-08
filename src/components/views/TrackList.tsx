import { useContext, useEffect, useMemo } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import {
  CellContextMenuEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  RowClassParams,
  RowClickedEvent,
  RowDragEndEvent,
  SelectionChangedEvent
} from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectColumnState,
  setColumnState
} from "../../features/library/librarySlice";
import { defaultColumnDefinitions } from "../../features/library/libraryColumns";
import { setQueue } from "../../features/player/playerSlice";
import {
  selectCurrentTrack,
  selectVisiblePlaylist,
  selectVisibleTracks
} from "../../features/sharedSelectors";
import { TrackId } from "../../features/tracks/tracksTypes";
import { GridContext } from "../../contexts/GridContext";
import { useTranslation } from "react-i18next";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { setSelectedTracks } from "../../features/tracks/tracksSlice";
import { setPlaylistTracks } from "../../features/playlists/playlistsSlice";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";

export const TrackList = () => {
  const dispatch = useAppDispatch();

  const currentTrack = useAppSelector(selectCurrentTrack)?.id;
  const rowData = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const { gridRef } = useContext(GridContext);
  const { setMenuData } = useContext(MenuContext);
  const { show: showHeaderContextMenu } = useContextMenu({
    id: "tracklistheader"
  });
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem"
  });

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
            colDef.field != "id" && colDef.field != "uri"
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
      const queue = [] as TrackId[];
      gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
        queue.push(node.data.id);
      });
      dispatch(
        setQueue({
          queue,
          queueIndex: event.rowIndex ?? 0
        })
      );
    }
  };

  const handleSortChanged = () => {
    if (gridRef?.current?.api) {
      const queue = [] as TrackId[];
      gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
        queue.push(node.data.id);
      });
      let queueIndex = null;
      if (currentTrack) {
        queueIndex = queue.indexOf(currentTrack);
      }
      dispatch(setQueue({ queue, queueIndex }));
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
          trackId: node.data.id
        });
      }
    });
    dispatch(
      setPlaylistTracks({ playlistId: visiblePlaylist.id, tracks: newOrder })
    );
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
          if (currentTrack == params.data.id) {
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
