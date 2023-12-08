import { useState, useMemo, useCallback } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { RowClickedEvent } from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/library/librarySlice";
import {
  pluginHandles,
  selectPluginsActive
} from "../features/plugins/pluginsSlice";
import { SourceHandle } from "../features/plugins/pluginsTypes";
import { plugins } from "../plugins/plugins";

export const TrackList = () => {
  const rowData = useAppSelector(selectAllTracks);
  const pluginsActive = useAppSelector(selectPluginsActive);
  const [columnDefs] = useState([{ field: "uri" }, { field: "title" }]);
  const defaultColDef = useMemo(
    () => ({
      sortable: true,
      resizable: true,
      lockPinned: true,
      flex: 0.3
    }),
    []
  );

  // Temporary function for testing the loading/playing (TrackList shouldn't refer to plugins)
  const handleCellDoubleClicked = useCallback(
    (event: RowClickedEvent) => {
      for (const pluginId of pluginsActive) {
        if (plugins[pluginId].type === "source") {
          const plugin = pluginHandles[pluginId] as SourceHandle;
          plugin.loadAndPlayTrack(event.data.uri);
        }
      }
    },
    [pluginsActive]
  );

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
        getRowId={(params) => params.data.uri}
        rowData={rowData}
        columnDefs={columnDefs}
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
      />
    </div>
  );
};
