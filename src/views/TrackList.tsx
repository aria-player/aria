import { useEffect, useMemo, useRef } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { RowClassParams, RowClickedEvent } from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/library/librarySlice";
import { columnDefinitions } from "../features/library/libraryColumns";
import {
  loadAndPlayTrack,
  selectCurrentTrackId
} from "../features/player/playerSlice";

export const TrackList = () => {
  const dispatch = useAppDispatch();

  const currentTrack = useAppSelector(selectCurrentTrackId);
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
    dispatch(loadAndPlayTrack(event.data.id));
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
