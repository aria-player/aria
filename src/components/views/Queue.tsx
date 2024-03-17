import {
  GridApi,
  ICellRendererParams,
  IRowNode,
  RowDragEndEvent,
  RowDragLeaveEvent,
  RowDragMoveEvent,
  RowHighlightPosition,
  RowNode,
  SelectionChangedEvent
} from "@ag-grid-community/core";
import { AgGridReact } from "@ag-grid-community/react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { t } from "i18next";
import { AlbumTrackListRow } from "./subviews/AlbumTrackListRow";
import { selectCurrentQueueTracks } from "../../features/currentSelectors";
import { useCallback } from "react";
import {
  reorderQueue,
  selectQueueSource
} from "../../features/player/playerSlice";
import styles from "./Queue.module.css";
import { TrackListItem } from "../../features/tracks/tracksTypes";
import { store } from "../../app/store";

const ROW_HEIGHT = 48;
const PLAYING_SOURCE_SEPARATOR_INDEX = 2;

export type QueueItem = TrackListItem & {
  separator?: boolean;
};

function clearRowHighlights(gridApi: GridApi) {
  gridApi.forEachNode((node) => {
    (node as RowNode).setHighlighted(null);
  });
}

function getDropIndex(mouseY: number, overNode?: IRowNode) {
  if (
    overNode == null ||
    overNode.rowTop == null ||
    overNode.rowIndex == null
  ) {
    return selectCurrentQueueTracks(store.getState()).length;
  }

  const element = document.querySelector(".ag-full-width-container");
  if (!element) return -1;
  const style = getComputedStyle(element);
  const padding = parseInt(style.marginTop, 10);
  return mouseY - overNode.rowTop - padding <= ROW_HEIGHT / 2
    ? overNode.rowIndex
    : overNode.rowIndex + 1;
}

const handleRowDragLeave = (event: RowDragLeaveEvent) => {
  clearRowHighlights(event.api);
};

const handleRowDragMove = (event: RowDragMoveEvent) => {
  clearRowHighlights(event.api);

  const dropIndex = getDropIndex(event.y, event.overNode);
  const highlight =
    event.overNode?.rowIndex && event.overNode.rowIndex - dropIndex == 0
      ? RowHighlightPosition.Above
      : RowHighlightPosition.Below;
  (
    event.api.getDisplayedRowAtIndex(dropIndex - highlight) as RowNode
  )?.setHighlighted(highlight);
};

const handleSelectionChanged = (params: SelectionChangedEvent) => {
  const selectedNodes = params.api.getSelectedNodes();
  const lastSelectedIndex = selectedNodes[selectedNodes.length - 1]?.rowIndex;
  if (lastSelectedIndex) {
    const lastSelectedSection =
      lastSelectedIndex > PLAYING_SOURCE_SEPARATOR_INDEX
        ? "playingSource"
        : "currentTrack";
    selectedNodes.forEach((node) => {
      const nodeSection =
        node.rowIndex && node.rowIndex > PLAYING_SOURCE_SEPARATOR_INDEX
          ? "playingSource"
          : "currentTrack";
      if (nodeSection !== lastSelectedSection) {
        node.setSelected(false);
      }
    });
  }
};

export const Queue = () => {
  const dispatch = useAppDispatch();
  const { gridRef, gridProps } = useTrackGrid();
  const queueSource = useAppSelector(selectQueueSource);
  const visibleTracks = useAppSelector(selectCurrentQueueTracks).map(
    (track, index) => {
      return {
        ...track,
        track: index > PLAYING_SOURCE_SEPARATOR_INDEX ? index - 1 : index
      };
    }
  ) as QueueItem[];

  const fullWidthCellRenderer = useCallback(
    (params: ICellRendererParams) =>
      params.node.data.separator ? (
        params.node.rowIndex == 0 ? (
          <div className={styles.separator}>Current track</div>
        ) : (
          <div className={styles.separator}>Playing from: {queueSource}</div>
        )
      ) : (
        <AlbumTrackListRow {...params} />
      ),
    [queueSource]
  );

  const handleRowDragEnd = useCallback(
    (event: RowDragEndEvent) => {
      clearRowHighlights(event.api);
      // Unmanaged AG-Grid drag implementation so that queue 'sections' can remain independent

      // 1. If there's no overNode, default to the last node (so that empty space can be dragged to)
      let overNode = event.overNode;
      if (overNode == null || overNode.rowTop == null) {
        const lastRow = visibleTracks[visibleTracks.length - 1].itemId;
        overNode = event.api.getRowNode(lastRow) as RowNode;
      }
      if (overNode.rowTop == null) return;

      // 2. Either move the selected tracks, or a single unselected track if it was dragged
      const movingNode = event.node;
      const selectedNodes = event.api.getSelectedNodes();
      const isMovingNodeSelected = selectedNodes.find(
        (node) => node.data.itemId === movingNode.data.itemId
      );
      const movingTracks = isMovingNodeSelected
        ? selectedNodes
            .map((node) => node.data)
            .sort((a, b) => {
              const indexA = visibleTracks.findIndex(
                (track) => track.itemId === a.itemId
              );
              const indexB = visibleTracks.findIndex(
                (track) => track.itemId === b.itemId
              );
              return indexA - indexB;
            })
        : [movingNode.data];

      // 3. Build the reordered queue
      const dropIndex = getDropIndex(event.y, overNode);
      if (
        movingNode.rowIndex &&
        movingNode.rowIndex > PLAYING_SOURCE_SEPARATOR_INDEX &&
        dropIndex > PLAYING_SOURCE_SEPARATOR_INDEX
      ) {
        const movingTrackIds = movingTracks.map((track) => track.itemId);
        const newQueueTail = visibleTracks.filter(
          (track) => !movingTrackIds.includes(track.itemId)
        );

        let offset = 0;
        movingTracks.forEach((track) => {
          const index = visibleTracks.findIndex(
            (t) => t.itemId === track.itemId
          );
          if (index < dropIndex) {
            offset++;
          }
        });

        const adjustedDropIndex = Math.min(
          dropIndex - offset,
          newQueueTail.length
        );
        newQueueTail.splice(adjustedDropIndex, 0, ...movingTracks);

        dispatch(
          reorderQueue(
            newQueueTail
              .filter((track) => !track.separator)
              .map((track) => ({
                trackId: track.trackId,
                itemId: track.itemId
              }))
          )
        );
      }
    },
    [dispatch, visibleTracks]
  );

  return (
    <div
      style={{ height: "100%" }}
      className={
        "ag-theme-balham ag-overrides-track-summary-rows ag-overrides-queue"
      }
    >
      <AgGridReact
        {...gridProps}
        ref={gridRef}
        rowData={visibleTracks}
        columnDefs={[]}
        fullWidthCellRenderer={fullWidthCellRenderer}
        onSelectionChanged={handleSelectionChanged}
        onRowDragMove={handleRowDragMove}
        onRowDragEnd={handleRowDragEnd}
        onRowDragLeave={handleRowDragLeave}
        isFullWidthRow={() => true}
        isRowSelectable={(params) => !params.data.separator}
        headerHeight={0}
        rowHeight={ROW_HEIGHT}
        overlayNoRowsTemplate={t("tracks.emptyQueue")}
        suppressHeaderFocus
        alwaysShowVerticalScroll
        suppressMoveWhenRowDragging
      />
    </div>
  );
};
