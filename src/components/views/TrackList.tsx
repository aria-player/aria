import { useContext, useEffect, useMemo } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import {
  CellContextMenuEvent,
  CellDoubleClickedEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridApi,
  RowClassParams,
  RowDragEndEvent,
  SortChangedEvent
} from "@ag-grid-community/core";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  setLibraryColumnState,
  selectLibraryColumnState
} from "../../features/library/librarySlice";
import { defaultColumnDefinitions } from "../../features/library/libraryColumns";
import {
  selectQueueSource,
  setQueueToNewSource,
  updateQueueAfterChange
} from "../../features/player/playerSlice";

import { useTranslation } from "react-i18next";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import {
  selectPlaylistConfigById,
  setPlaylistTracks,
  updatePlaylistColumnState
} from "../../features/playlists/playlistsSlice";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";
import { LibraryView, View } from "../../app/view";
import {
  filterHiddenColumnSort,
  overrideColumnStateSort
} from "../../app/utils";
import { store } from "../../app/store";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import {
  selectCurrentTrack,
  selectCurrentPlaylist
} from "../../features/currentSelectors";
import { selectSortedTrackList } from "../../features/genericSelectors";
import {
  selectVisibleTracks,
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisiblePlaylistConfig
} from "../../features/visibleSelectors";
import { compareMetadata } from "../../app/sort";
import {
  addToSearchHistory,
  selectSearch
} from "../../features/search/searchSlice";
import NoRowsOverlay from "./subviews/NoRowsOverlay";

export const TrackList = () => {
  const dispatch = useAppDispatch();
  const { gridRef, gridProps, isGridReady } = useTrackGrid();
  const currentTrack = useAppSelector(selectCurrentTrack);
  const rowData = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const queueSource = useAppSelector(selectQueueSource);
  const { setMenuData } = useContext(MenuContext);
  const { show: showHeaderContextMenu } = useContextMenu({
    id: "tracklistheader"
  });
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem"
  });
  const visibleView = visiblePlaylist?.id ?? visibleViewType;

  const { t } = useTranslation();
  const libraryColumnState = useAppSelector(selectLibraryColumnState);
  const playlistConfig = useAppSelector(selectVisiblePlaylistConfig);

  const columnDefs = useMemo<ColDef[]>(() => {
    return defaultColumnDefinitions
      .map((colDef) => {
        let colDefOverrides = {
          ...libraryColumnState?.find((col) => col.colId == colDef.field)
        } as ColDef;

        let sort =
          visibleViewType == LibraryView.Songs && !colDefOverrides.hide
            ? colDefOverrides?.sort
            : null;
        let sortIndex =
          visibleViewType == LibraryView.Songs && !colDefOverrides.hide
            ? colDefOverrides?.sortIndex
            : null;
        if (playlistConfig?.columnState != null && colDef.field) {
          const playlistColDefOverrides = {
            ...playlistConfig?.columnState?.find(
              (col) => col.colId == colDef.field
            )
          } as ColDef;
          sort = !playlistColDefOverrides.hide
            ? playlistColDefOverrides.sort
            : null;
          sortIndex = !playlistColDefOverrides.hide
            ? playlistColDefOverrides.sortIndex
            : null;
          if (
            playlistConfig.useCustomLayout &&
            playlistConfig.columnState.length > 0
          ) {
            colDefOverrides = playlistColDefOverrides;
          }
        }

        delete colDefOverrides.rowGroup;
        delete colDefOverrides.pivot;
        return {
          ...colDef,
          ...colDefOverrides,
          sort,
          sortIndex,
          sortable: visibleViewType != View.Search && colDef.field != "art",
          headerName:
            colDef.field != "trackId" && colDef.field != "uri"
              ? t(`columns.${colDef.field}`)
              : colDef.field
        };
      })
      .sort((colDefA, colDefB) => {
        const orderedColumns =
          playlistConfig?.useCustomLayout && playlistConfig?.columnState
            ? playlistConfig.columnState
            : libraryColumnState;
        const indexA = orderedColumns?.findIndex(
          (libraryCol) => libraryCol.colId === colDefA.field
        );
        const indexB = orderedColumns?.findIndex(
          (libraryCol) => libraryCol.colId === colDefB.field
        );
        return (indexA || 2) - (indexB || 1);
      });
  }, [libraryColumnState, t, visibleViewType, playlistConfig]);

  const defaultColDef = useMemo(
    () => ({
      comparator: (valueA: string | number, valueB: string | number) =>
        compareMetadata(valueA, valueB),
      hide: false,
      lockPinned: true,
      flex: 0.3,
      cellStyle: (params: RowClassParams) => {
        return {
          fontWeight:
            params.data.itemId === selectCurrentTrack(store.getState())?.itemId
              ? 700
              : 400,
          fontStyle: !params.data.metadataLoaded ? "italic" : "normal"
        };
      }
    }),
    []
  );

  const updateColumnState = (api: GridApi, alwaysCopyToPlaylist: boolean) => {
    let newColumnState = filterHiddenColumnSort(api.getColumnState());
    // Update the visible playlist column state
    if (
      visiblePlaylist &&
      (alwaysCopyToPlaylist || playlistConfig?.useCustomLayout)
    ) {
      dispatch(
        updatePlaylistColumnState({
          playlistId: visiblePlaylist.id,
          columnState: newColumnState
        })
      );
    }
    // Update the current playlist column state, if need be
    const currentPlaylist = selectCurrentPlaylist(store.getState())?.id;
    if (currentPlaylist && visiblePlaylist?.id != currentPlaylist) {
      const currentPlaylistConfig = selectPlaylistConfigById(
        store.getState(),
        currentPlaylist
      );
      if (!currentPlaylistConfig?.useCustomLayout) {
        dispatch(
          updatePlaylistColumnState({
            playlistId: currentPlaylist,
            columnState: overrideColumnStateSort(
              newColumnState,
              currentPlaylistConfig?.columnState ?? []
            )
          })
        );
      }
    }
    if (!playlistConfig?.useCustomLayout) {
      if (visibleView != LibraryView.Songs) {
        // Make sure to exclude the playlist sort from the updated library column state
        newColumnState = overrideColumnStateSort(
          newColumnState,
          libraryColumnState
        );
      }
      dispatch(setLibraryColumnState(newColumnState));
    }
  };

  const handleCellDoubleClicked = (event: CellDoubleClickedEvent) => {
    // We could use selectSortedTrackList here instead,
    // but then we'd be re-calculating the same sorted tracks that are already displayed
    const search = selectSearch(store.getState());
    const queue = [] as PlaylistItem[];
    event.api.forEachNodeAfterFilterAndSort((node) => {
      queue.push({
        itemId: node.data.itemId,
        trackId: node.data.trackId
      });
    });
    if (visibleView == View.Search) {
      dispatch(addToSearchHistory(search));
    }
    dispatch(
      setQueueToNewSource({
        queue,
        queueIndex: event.rowIndex ?? 0,
        queueSource:
          visibleView == View.Search ? visibleView + "/" + search : visibleView,
        queueGrouping: null,
        queueSelectedGroup: null
      })
    );
  };

  const handleColumnVisible = (params: ColumnVisibleEvent) => {
    const state = store.getState();
    const currentPlaylist = selectCurrentPlaylist(state)?.id;

    let oldColumnState = selectLibraryColumnState(state);
    if (currentPlaylist) {
      const playlistConfig = selectPlaylistConfigById(state, currentPlaylist);
      if (playlistConfig?.useCustomLayout) {
        oldColumnState = playlistConfig.columnState;
      } else if (oldColumnState && playlistConfig?.columnState) {
        oldColumnState = overrideColumnStateSort(
          oldColumnState,
          playlistConfig?.columnState
        );
      }
    }

    updateColumnState(params.api, true);

    if (
      oldColumnState?.some(
        (column) =>
          column.sort !== null &&
          params.columns?.some(
            (c) => c.getColId() === column.colId && !c.getColDef().hide
          )
      )
    ) {
      if (!state.player.shuffle) {
        // A column that was being used to sort the queue is now hidden, update the queue
        dispatch(
          updateQueueAfterChange(
            selectSortedTrackList(
              store.getState(),
              selectCurrentPlaylist(store.getState())?.id
            )
          )
        );
      }
    }
  };

  const handleSortChanged = (params: SortChangedEvent) => {
    if (visiblePlaylist) {
      dispatch(
        updatePlaylistColumnState({
          playlistId: visiblePlaylist.id,
          columnState: params.api.getColumnState()
        })
      );
    } else {
      dispatch(setLibraryColumnState(params.api.getColumnState()));
    }
    if (queueSource == visibleView) {
      dispatch(
        updateQueueAfterChange(
          selectSortedTrackList(store.getState(), visiblePlaylist?.id)
        )
      );
    }
  };

  const handleColumnMovedOrResized = (
    params: ColumnMovedEvent | ColumnResizedEvent
  ) => {
    if (params.finished && params.column) {
      updateColumnState(params.api, false);
    }
  };

  useEffect(() => {
    if (gridRef?.current?.api)
      gridRef.current.api.refreshCells({
        force: true
      });
  }, [gridRef, currentTrack, rowData]);

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
      const search = selectSearch(store.getState());
      setMenuData({
        itemId: event.node.data.trackId,
        itemSource:
          visibleView == View.Search ? visibleView + "/" + search : visibleView,
        itemIndex: event.rowIndex ?? undefined,
        metadata: event.node.data,
        type: "tracklistitem"
      });
    }
    showCellContextMenu({ event: event.event as TriggerEvent });
  };

  const handleRowDragEnd = (event: RowDragEndEvent) => {
    if (!visiblePlaylist?.id) return;
    if (
      event.api.getColumnState().filter((col) => col.sort !== null).length != 0
    )
      return;
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

  return (
    <div
      className={"ag-theme-balham"}
      style={{ width: "100%", height: "100%" }}
    >
      <div style={{ display: isGridReady ? "block" : "none", height: "100%" }}>
        <AgGridReact
          {...gridProps}
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellDoubleClicked={handleCellDoubleClicked}
          onSortChanged={handleSortChanged}
          onColumnMoved={handleColumnMovedOrResized}
          onColumnResized={handleColumnMovedOrResized}
          onColumnVisible={handleColumnVisible}
          onCellContextMenu={handleCellContextMenu}
          onRowDragEnd={handleRowDragEnd}
          rowHeight={33}
          headerHeight={37}
          rowDragManaged={visibleViewType == View.Playlist}
          noRowsOverlayComponent={NoRowsOverlay}
          multiSortKey="ctrl"
          rowDragEntireRow
          suppressDragLeaveHidesColumns
          suppressMoveWhenRowDragging
        />
      </div>
    </div>
  );
};
