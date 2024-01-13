import { useEffect, useMemo, useRef } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { RowClassParams, RowClickedEvent } from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/library/librarySlice";
import { columnDefinitions } from "../features/library/libraryColumns";
import { setQueue } from "../features/player/playerSlice";
import { selectCurrentTrack } from "../features/sharedSelectors";
import { TrackId } from "../features/library/libraryTypes";

export const TrackList = () => {
  const dispatch = useAppDispatch();

  const currentTrack = useAppSelector(selectCurrentTrack)?.id;
  const rowData = useAppSelector(selectAllTracks);

  const gridRef = useRef<AgGridReact>(null);
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      lockPinned: true,
      flex: 0.3
    }),
    []
  );

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
    }
  };

  useEffect(() => {
    if (gridRef.current?.api) gridRef.current?.api.redrawRows();
  }, [currentTrack]);

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
        ref={gridRef}
        getRowId={(params) => params.data.uri}
        rowData={rowData}
        columnDefs={columnDefinitions}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        onCellDoubleClicked={handleCellDoubleClicked}
        onSortChanged={handleSortChanged}
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
