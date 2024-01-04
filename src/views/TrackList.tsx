import { useMemo, useCallback } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { RowClickedEvent } from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppSelector } from "../app/hooks";
import { selectAllTracks } from "../features/library/librarySlice";
import {
  pluginHandles,
  selectActivePlugins
} from "../features/plugins/pluginsSlice";
import { SourceHandle } from "../features/plugins/pluginsTypes";
import { plugins } from "../plugins/plugins";
import { columnDefinitions } from "../features/library/libraryColumns";

export const TrackList = () => {
  const rowData = useAppSelector(selectAllTracks);
  const activePlugins = useAppSelector(selectActivePlugins);
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
      for (const pluginId of activePlugins) {
        if (plugins[pluginId].type === "source") {
          const plugin = pluginHandles[pluginId] as SourceHandle;
          plugin.loadAndPlayTrack(event.data);
        }
      }
    },
    [activePlugins]
  );

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
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
      />
    </div>
  );
};
