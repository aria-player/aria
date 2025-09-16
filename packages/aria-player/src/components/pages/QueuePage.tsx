import {
  BodyScrollEvent,
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
import { selectCurrentQueueTracks } from "../../features/currentSelectors";
import { useCallback, useContext } from "react";
import {
  addStrayTracksToQueue,
  addTracksToUpNext,
  reorderUpNext,
  reorderQueue,
  selectUpNext
} from "../../features/player/playerSlice";
import { TrackListItem } from "../../features/tracks/tracksTypes";
import { store } from "../../app/store";
import { setSelectedTracks } from "../../features/tracks/tracksSlice";
import { nanoid } from "@reduxjs/toolkit";
import { QueueItem } from "../../features/player/playerTypes";
import { showToast } from "../../app/toasts";
import { t } from "i18next";
import NoRowsOverlay from "../views/subviews/NoRowsOverlay";
import QueueSeparator from "../views/subviews/QueueSeparator";
import { TrackSummaryRow } from "../views/subviews/TrackSummaryRow";
import { ScrollContext } from "../../contexts/ScrollContext";

const ROW_HEIGHT = 48;

export type QueueListItem = TrackListItem & {
  separator?: boolean;
};

const copyTracksToUpNext = (tracks: QueueItem[], dropIndex?: number) => {
  store.dispatch(
    addTracksToUpNext({
      dropIndex,
      tracks: tracks.map((track) => ({
        trackId: track.trackId,
        itemId: nanoid()
      }))
    })
  );
};

const copyStrayTracksToQueue = (tracks: QueueItem[], dropIndex: number) => {
  store.dispatch(
    addStrayTracksToQueue({
      dropIndex,
      tracks: tracks.map((track) => ({
        trackId: track.trackId,
        itemId: nanoid()
      }))
    })
  );
};

const fullWidthCellRenderer = (params: ICellRendererParams) =>
  params.node.data.separator ? (
    <QueueSeparator {...params} />
  ) : (
    <TrackSummaryRow {...params} />
  );

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

export const QueuePage = () => {
  const dispatch = useAppDispatch();
  const { gridRef, gridProps } = useTrackGrid();
  const { setScrollY } = useContext(ScrollContext);
  const upNext = useAppSelector(selectUpNext).map((track) => track.itemId);

  const upNextSeparatorIndex = 2;
  const queueSourceSeparatorIndex =
    upNextSeparatorIndex + (upNext.length ? upNext.length + 1 : 0);

  const getTrackSection = useCallback(
    (index: number) =>
      index > queueSourceSeparatorIndex &&
      queueSourceSeparatorIndex != upNextSeparatorIndex
        ? 2
        : index > upNextSeparatorIndex
          ? 1
          : 0,
    [queueSourceSeparatorIndex]
  );

  const visibleTracks = useAppSelector(selectCurrentQueueTracks).map(
    (track, index) => {
      return {
        ...track,
        track: index - getTrackSection(index)
      };
    }
  ) as QueueListItem[];

  const handleBodyScroll = (event: BodyScrollEvent) => {
    setScrollY(event.top);
  };

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

      // 3. Build the new queue
      const dropIndex = getDropIndex(event.y, overNode);
      const dropSection = getTrackSection(dropIndex);
      const dragSection = getTrackSection(
        isMovingNodeSelected ? selectedNodes[0].rowIndex! : movingNode.rowIndex!
      );

      if (dragSection == dropSection) {
        if (dragSection == 0) return;
        const reorderingUpNext =
          dragSection == 1 && dropIndex <= queueSourceSeparatorIndex;
        const movingTrackIds = movingTracks.map((track) => track.itemId);
        const newQueueTail = visibleTracks.filter(
          (track) =>
            !movingTrackIds.includes(track.itemId) &&
            upNext.includes(track.itemId) === reorderingUpNext
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
          dropIndex -
            offset -
            (reorderingUpNext ? upNextSeparatorIndex + 1 : upNext.length),
          newQueueTail.length
        );
        newQueueTail.splice(adjustedDropIndex, 0, ...movingTracks);

        if (reorderingUpNext) {
          dispatch(
            reorderUpNext(
              newQueueTail
                .filter((track) => !track.separator)
                .map((track) => ({
                  trackId: track.trackId,
                  itemId: track.itemId
                }))
            )
          );
        } else {
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
      } else if (dropIndex <= upNextSeparatorIndex) {
        copyTracksToUpNext(movingTracks);
        if (movingTracks.length == 1) {
          showToast(
            t("toasts.addedNamedTrackToQueue", {
              title: movingTracks[0].title
            })
          );
        } else {
          showToast(
            t("toasts.addedTracksToQueue", {
              count: movingTracks.length
            })
          );
        }
      } else if (dropIndex <= queueSourceSeparatorIndex) {
        copyTracksToUpNext(movingTracks, dropIndex - upNextSeparatorIndex - 1);
      } else {
        copyStrayTracksToQueue(
          movingTracks,
          dropIndex - queueSourceSeparatorIndex
        );
      }
    },
    [
      dispatch,
      getTrackSection,
      visibleTracks,
      queueSourceSeparatorIndex,
      upNext
    ]
  );

  const handleSelectionChanged = (params: SelectionChangedEvent) => {
    const selectedNodes = params.api.getSelectedNodes();
    const lastSelectedIndex = selectedNodes[selectedNodes.length - 1]?.rowIndex;
    if (lastSelectedIndex) {
      const lastSelectedSection = getTrackSection(lastSelectedIndex);
      selectedNodes.forEach((node) => {
        const nodeSection = getTrackSection(node.rowIndex!);
        if (nodeSection !== lastSelectedSection) {
          node.setSelected(false);
        }
      });
      dispatch(
        setSelectedTracks(
          params.api.getSelectedRows().map((node) => ({
            itemId: node.itemId,
            trackId: node.trackId
          }))
        )
      );
    }
  };

  return (
    <div
      style={{ height: "100%" }}
      className={
        "queue ag-theme-balham ag-overrides-track-summary-rows ag-overrides-queue"
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
        onBodyScroll={handleBodyScroll}
        isFullWidthRow={() => true}
        headerHeight={0}
        rowHeight={ROW_HEIGHT}
        noRowsOverlayComponent={NoRowsOverlay}
        suppressHeaderFocus
        alwaysShowVerticalScroll
        suppressMoveWhenRowDragging
      />
    </div>
  );
};
