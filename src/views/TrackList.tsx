import { useEffect, useMemo, useRef } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import {
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  RowClassParams,
  RowClickedEvent
} from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  selectAllTracks,
  selectColumnState,
  setColumnState
} from "../features/library/librarySlice";
import { defaultColumnDefinitions } from "../features/library/libraryColumns";
import { setQueue } from "../features/player/playerSlice";
import { selectCurrentTrack } from "../features/sharedSelectors";
import { TrackId } from "../features/library/libraryTypes";

export const TrackList = () => {
  const dispatch = useAppDispatch();

  const currentTrack = useAppSelector(selectCurrentTrack)?.id;
  const rowData = useAppSelector(selectAllTracks);

  const gridRef = useRef<AgGridReact>(null);

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
        return { ...colDef, ...updatedColumnState };
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
  }, [columnState]);

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
    if (gridRef.current?.api) {
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
    if (gridRef.current?.api) {
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
    if (params.finished) {
      updateColumnState();
    }
  };

  useEffect(() => {
    if (gridRef.current?.api) gridRef.current?.api.redrawRows();
  }, [currentTrack]);

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
        ref={gridRef}
        getRowId={(params) => params.data.id}
        rowData={rowData}
        columnDefs={columnDefs as ColDef[]}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        onCellDoubleClicked={handleCellDoubleClicked}
        onSortChanged={handleSortChanged}
        onColumnMoved={handleColumnMovedOrResized}
        onColumnResized={handleColumnMovedOrResized}
        rowHeight={33}
        headerHeight={37}
        suppressCellFocus
        rowDragMultiRow
        suppressDragLeaveHidesColumns
        suppressScrollOnNewData
        suppressMoveWhenRowDragging
        rowDragEntireRow
        animateRows
        alwaysShowVerticalScroll
        getRowStyle={(params: RowClassParams) => {
          if (currentTrack == params.data.id) {
            return { fontWeight: 700 };
          }
        }}
      />
    </div>
  );
};
