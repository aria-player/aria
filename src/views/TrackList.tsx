import { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-balham.css";
import { RowClickedEvent } from "@ag-grid-community/core";
import styles from "./TrackList.module.css";

export const TrackList = () => {
  const [rowData, setRowData] = useState();
  const [columnDefs] = useState([
    { field: "make" },
    { field: "model" },
    { field: "price" }
  ]);
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      lockPinned: true,
      flex: 0.3
    }),
    []
  );

  const cellClickedListener = useCallback((event: RowClickedEvent) => {
    console.log("cellClicked", event);
  }, []);

  useEffect(() => {
    fetch("https://www.ag-grid.com/example-assets/row-data.json")
      .then((result) => result.json())
      .then((rowData) => setRowData(rowData));
  }, []);

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        onCellClicked={cellClickedListener}
        rowHeight={33}
        headerHeight={39}
        suppressCellFocus
        rowDragMultiRow
        suppressDragLeaveHidesColumns
        suppressScrollOnNewData
        suppressMoveWhenRowDragging
        rowDragEntireRow
        animateRows
      />
    </div>
  );
};
