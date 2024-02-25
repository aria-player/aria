import { useCallback, useContext, useEffect, useMemo } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import {
  CellContextMenuEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  GridReadyEvent,
  RowClassParams,
  RowClickedEvent,
  RowDragEndEvent,
  RowDragLeaveEvent,
  RowDragMoveEvent,
  SelectionChangedEvent
} from "@ag-grid-community/core";
import styles from "./TrackList.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  setLibraryColumnState,
  selectLibraryColumnState
} from "../../features/library/librarySlice";
import { defaultColumnDefinitions } from "../../features/library/libraryColumns";
import {
  reorderQueue,
  selectQueueSource,
  setQueueToNewSource,
  skipQueueIndexes,
  updateQueueAfterChange
} from "../../features/player/playerSlice";
import {
  selectCurrentPlaylist,
  selectCurrentTrack,
  selectSortedTrackList,
  selectVisiblePlaylist,
  selectVisiblePlaylistConfig,
  selectVisibleTracks,
  selectVisibleViewType
} from "../../features/sharedSelectors";
import { GridContext } from "../../contexts/GridContext";
import { useTranslation } from "react-i18next";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { setSelectedTracks } from "../../features/tracks/tracksSlice";
import {
  addTracksToPlaylist,
  selectPlaylistConfigById,
  setPlaylistTracks,
  updatePlaylistColumnState
} from "../../features/playlists/playlistsSlice";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";
import { nanoid } from "@reduxjs/toolkit";
import { LibraryView, View } from "../../app/view";
import {
  compareMetadata,
  filterHiddenColumnSort,
  overrideColumnStateSort
} from "../../app/utils";
import { store } from "../../app/store";

export const TrackList = () => {
  const dispatch = useAppDispatch();

  const currentTrack = useAppSelector(selectCurrentTrack);
  const rowData = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const queueSource = useAppSelector(selectQueueSource);
  const { gridRef } = useContext(GridContext);
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
          sortable: visibleViewType != View.Queue ? colDef.sortable : false,
          sort,
          sortIndex,
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
      flex: 0.3
    }),
    []
  );

  const updateColumnState = (alwaysCopyToPlaylist: boolean) => {
    if (gridRef?.current != null) {
      let newColumnState = filterHiddenColumnSort(
        gridRef.current.api.getColumnState()
      );
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
    }
  };

  const handleCellDoubleClicked = (event: RowClickedEvent) => {
    if (gridRef?.current?.api) {
      if (visibleView == View.Queue) {
        dispatch(skipQueueIndexes(event.rowIndex));
        return;
      }
      // We could use selectSortedTrackList here instead,
      // but then we'd be re-calculating the same sorted tracks that are already displayed
      const queue = [] as PlaylistItem[];
      gridRef.current.api.forEachNodeAfterFilterAndSort((node) => {
        queue.push({
          itemId: node.data.itemId,
          trackId: node.data.trackId
        });
      });
      dispatch(
        setQueueToNewSource({
          queue,
          queueIndex: event.rowIndex ?? 0,
          queueSource: visibleView
        })
      );
    }
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

    updateColumnState(true);

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

  const handleSortChanged = () => {
    if (!gridRef?.current) return;
    if (visibleView == View.Queue) return;
    if (visiblePlaylist) {
      dispatch(
        updatePlaylistColumnState({
          playlistId: visiblePlaylist.id,
          columnState: gridRef.current.api.getColumnState()
        })
      );
    } else {
      dispatch(setLibraryColumnState(gridRef.current.api.getColumnState()));
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
      updateColumnState(false);
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
      setMenuData({
        itemId: event.node.data.trackId,
        itemSource: visibleView,
        itemIndex: event.rowIndex ?? undefined,
        metadata: event.node.data,
        type: "tracklistitem"
      });
    }
    showCellContextMenu({ event: event.event as TriggerEvent });
  };

  const handleSelectionChanged = (event: SelectionChangedEvent) => {
    dispatch(
      setSelectedTracks(
        event.api.getSelectedRows().map((node) => ({
          itemId: node.itemId,
          trackId: node.trackId
        }))
      )
    );
  };

  const handleRowDragEnd = (event: RowDragEndEvent) => {
    if (!visiblePlaylist?.id && visibleViewType != View.Queue) return;
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
    if (visibleViewType == View.Queue) {
      dispatch(reorderQueue(newOrder));
    } else if (visiblePlaylist?.id) {
      dispatch(
        setPlaylistTracks({ playlistId: visiblePlaylist.id, tracks: newOrder })
      );
    }
  };

  const handleGridReady = (params: GridReadyEvent) => {
    let lastHoveredItem: HTMLElement | null = null;
    const treeElement = document.querySelector('[role="tree"]') as HTMLElement;

    const setOutline = (
      element: Element | null | undefined,
      enabled: boolean
    ) => {
      if (element)
        (element as HTMLElement).style.outline = enabled
          ? "2px solid var(--accent-color)"
          : "none";
    };

    const updateDragGhost = (
      trackTitle: string,
      playlist: string | null | undefined
    ) => {
      const ghostLabel = document.querySelector(".ag-dnd-ghost-label");
      if (!ghostLabel) return;

      const selectedRowsCount =
        gridRef?.current?.api.getSelectedRows().length ?? 0;
      ghostLabel.textContent = playlist
        ? selectedRowsCount <= 1
          ? t("tracks.addNamedTrackToPlaylist", {
              title: trackTitle,
              playlist
            })
          : t("tracks.addSelectedToPlaylist", {
              count: selectedRowsCount,
              playlist
            })
        : selectedRowsCount <= 1
          ? trackTitle
          : t("tracks.selectedCount", { count: selectedRowsCount });

      if (!playlist && lastHoveredItem) {
        setOutline(lastHoveredItem, false);
      }
    };

    const isPlaylist = (item: HTMLElement | null) => {
      return (
        item != null &&
        item.getAttribute("data-section") === "playlists" &&
        item.getAttribute("data-folder") != "true" &&
        item.getAttribute("data-item") != "header-playlists" &&
        item.getAttribute("data-item") != "playlists-empty"
      );
    };

    const getHoveredItem = (x: number, y: number) => {
      const targetElements = document.elementsFromPoint(x, y);
      const item = targetElements.find((element) =>
        element.matches('[data-section="playlists"]')
      ) as HTMLElement;
      setOutline(lastHoveredItem, false);
      if (!isPlaylist(item)) return null;

      setOutline(item.firstElementChild?.firstElementChild, true);
      lastHoveredItem = item.firstElementChild
        ?.firstElementChild as HTMLElement;
      return { id: item.getAttribute("data-item"), title: item.textContent };
    };

    const playlistDropZone = {
      getContainer: () => treeElement,

      onDragging: (params: RowDragMoveEvent) => {
        const item = getHoveredItem(params.event.clientX, params.event.clientY);
        updateDragGhost(params.node.data.title, item?.title);
      },

      onDragLeave: (params: RowDragLeaveEvent) => {
        updateDragGhost(params.node.data.title, null);
      },

      onDragStop: (params: RowDragEndEvent) => {
        updateDragGhost(params.node.data.title, null);
        const item = getHoveredItem(params.event.clientX, params.event.clientY);
        if (!item?.id) return;

        const selectedRowsCount =
          gridRef?.current?.api.getSelectedRows().length ?? 0;
        let newTracks = [] as PlaylistItem[];
        if (selectedRowsCount <= 1) {
          newTracks = [
            {
              itemId: nanoid(),
              trackId: params.node.data.trackId
            }
          ];
        } else {
          newTracks = gridRef?.current?.api
            .getSelectedRows()
            .map((node) => {
              return { itemId: nanoid(), trackId: node.trackId };
            })
            .filter(Boolean) as PlaylistItem[];
        }
        dispatch(
          addTracksToPlaylist({
            playlistId: item.id,
            newTracks
          })
        );
      }
    };

    params.api.addRowDropZone(playlistDropZone);
  };

  const highlightCurrentTrack = useCallback(
    (params: RowClassParams) => {
      if (
        params.data.itemId === currentTrack?.itemId &&
        (queueSource == visibleView || visibleViewType == View.Queue)
      ) {
        return { fontWeight: 700 };
      }
    },
    [currentTrack?.itemId, queueSource, visibleView, visibleViewType]
  );

  return (
    <div className={`${styles.tracklist} ag-theme-balham`}>
      <AgGridReact
        ref={gridRef}
        getRowId={(params) => params.data.itemId}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        rowSelection="multiple"
        onGridReady={handleGridReady}
        onCellDoubleClicked={handleCellDoubleClicked}
        onSortChanged={handleSortChanged}
        onColumnMoved={handleColumnMovedOrResized}
        onColumnResized={handleColumnMovedOrResized}
        onColumnVisible={handleColumnVisible}
        onCellContextMenu={handleCellContextMenu}
        onSelectionChanged={handleSelectionChanged}
        onRowDragEnd={handleRowDragEnd}
        getRowStyle={highlightCurrentTrack}
        rowHeight={33}
        headerHeight={37}
        animateRows={false}
        suppressCellFocus
        rowDragMultiRow
        suppressDragLeaveHidesColumns
        suppressScrollOnNewData
        suppressMoveWhenRowDragging
        rowDragEntireRow
        alwaysShowVerticalScroll
        preventDefaultOnContextMenu
        rowDragManaged={
          visibleViewType == View.Playlist || visibleViewType == View.Queue
        }
        multiSortKey="ctrl"
        rowDragText={(params) =>
          params.rowNodes?.length == 1
            ? params.rowNode?.data.title
            : t("tracks.selectedCount", {
                count: params.rowNodes?.length
              })
        }
        overlayNoRowsTemplate={
          visibleViewType == View.Queue
            ? t("tracks.emptyQueue")
            : visibleViewType == View.Playlist
              ? t("tracks.emptyPlaylist")
              : t("tracks.emptyLibrary")
        }
      />
    </div>
  );
};
