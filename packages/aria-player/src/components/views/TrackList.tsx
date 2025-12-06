import { useContext, useEffect, useMemo, useState } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import {
  BodyScrollEvent,
  CellContextMenuEvent,
  CellDoubleClickedEvent,
  ColDef,
  ColumnMovedEvent,
  ColumnResizedEvent,
  ColumnVisibleEvent,
  FocusGridInnerElementParams,
  GridApi,
  IDatasource,
  NavigateToNextHeaderParams,
  RowClassParams,
  RowDragEndEvent,
  SortChangedEvent,
  TabToNextHeaderParams
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
import { ArtistSection, LibraryView, View } from "../../app/view";
import {
  filterHiddenColumnSort,
  getRelativePath,
  getTrackId,
  parseArtistId,
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
  selectVisiblePlaylistConfig,
  selectVisibleArtistSection,
  selectVisibleSelectedTrackGroup
} from "../../features/visibleSelectors";
import { compareMetadata } from "../../app/sort";
import {
  addToSearchHistory,
  selectSearch
} from "../../features/search/searchSlice";
import NoRowsOverlay from "./subviews/NoRowsOverlay";
import {
  getSourceHandle,
  pluginHandles
} from "../../features/plugins/pluginsSlice";
import {
  addTracks,
  selectLibraryTracks
} from "../../features/tracks/tracksSlice";
import { useLocation } from "react-router-dom";

const EXTERNAL_TRACKS_BATCH_SIZE = 20;
const EXTERNAL_TRACKS_CACHE_OVERFLOW = 20;
const EXTERNAL_TRACKS_CONCURRENT_REQUESTS = 4;

export const TrackList = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { gridRef, gridProps, isGridReady } = useTrackGrid();
  const currentTrack = useAppSelector(selectCurrentTrack);
  const rowData = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleArtistSection = useAppSelector(selectVisibleArtistSection);
  const selectedArtistGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const queueSource = useAppSelector(selectQueueSource);
  const { setMenuData } = useContext(MenuContext);
  const { show: showHeaderContextMenu } = useContextMenu({
    id: "tracklistheader"
  });
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem"
  });
  const visibleView = visiblePlaylist?.id ?? visibleViewType;
  const [scrollY, setScrollY] = useState(0);
  const { t } = useTranslation();
  const libraryColumnState = useAppSelector(selectLibraryColumnState);
  const playlistConfig = useAppSelector(selectVisiblePlaylistConfig);
  const libraryTracks = useAppSelector(selectLibraryTracks);
  const showAttribution = [
    ...new Set(libraryTracks.map((track) => track.source))
  ].some((source) => pluginHandles[source]?.Attribution);

  const parsedArtistInfo = useMemo(() => {
    if (visibleViewType !== View.Artist || !selectedArtistGroup) return null;
    return parseArtistId(selectedArtistGroup);
  }, [selectedArtistGroup, visibleViewType]);

  const artistHandle = parsedArtistInfo
    ? getSourceHandle(parsedArtistInfo.source)
    : null;

  const useInfiniteRowModel =
    visibleViewType === View.Artist &&
    visibleArtistSection === ArtistSection.Songs &&
    !!parsedArtistInfo?.uri &&
    !!artistHandle?.getArtistTopTracks;

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
          sortable:
            visibleViewType != View.Search &&
            visibleViewType != View.Artist &&
            colDef.field != "art" &&
            colDef.field != "attribution",
          headerName:
            colDef.field != "trackId" &&
            colDef.field != "uri" &&
            colDef.field != "attribution"
              ? t(`columns.${colDef.field}`)
              : colDef.field
        };
      })
      .filter((col) => col.field !== "attribution" || showAttribution)
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
  }, [libraryColumnState, t, visibleViewType, playlistConfig, showAttribution]);

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
            params.data?.itemId ===
              selectCurrentTrack(store.getState())?.itemId &&
            queueSource == getRelativePath(location.pathname)
              ? 700
              : 400,
          fontStyle: !params.data?.metadataLoaded ? "italic" : "normal"
        };
      }
    }),
    [queueSource, location]
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
    const state = store.getState();
    const search = selectSearch(state);
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
        queueSource: getRelativePath(location.pathname),
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
              visibleViewType,
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
          selectSortedTrackList(
            store.getState(),
            visibleViewType,
            visiblePlaylist?.id
          )
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
      setMenuData({
        itemId: event.node.data.trackId,
        itemSource: getRelativePath(location.pathname),
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

  const handleFocusGridInnerElement = (params: FocusGridInnerElementParams) => {
    if (!params.fromBottom) {
      const firstFocusableColumn = gridRef?.current?.api
        .getAllDisplayedColumns()
        .find((col) => col.getColId() !== "art")
        ?.getColId();
      if (firstFocusableColumn) {
        params.api.setFocusedHeader(firstFocusableColumn);
      }
    } else if (showAttribution) {
      const lastFocusableColumn = gridRef?.current?.api
        .getAllDisplayedColumns()
        .slice()
        .reverse()
        .find((col) => col.getColId() !== "attribution")
        ?.getColId();
      if (lastFocusableColumn) {
        params.api.setFocusedHeader(lastFocusableColumn);
        return true;
      }
    }
    return !params.fromBottom;
  };

  const handleTabToNextHeader = (params: TabToNextHeaderParams) => {
    if (
      params.backwards &&
      (params.nextHeaderPosition?.column.getUniqueId() === "art" ||
        !params.nextHeaderPosition)
    ) {
      const treeElement = document.querySelector(
        '[role="tree"]'
      ) as HTMLElement;
      if (treeElement) {
        treeElement.focus();
      }
      return false;
    } else if (
      (!params.backwards &&
        params.nextHeaderPosition?.column.getUniqueId() === "attribution") ||
      !params.nextHeaderPosition
    ) {
      return false;
    }
    return params.nextHeaderPosition || false;
  };

  const handleNavigateToNextHeader = (params: NavigateToNextHeaderParams) => {
    if (
      (params.key === "ArrowLeft" &&
        params.nextHeaderPosition?.column.getUniqueId() === "art") ||
      (params.key === "ArrowRight" &&
        params.nextHeaderPosition?.column.getUniqueId() === "attribution")
    ) {
      return null;
    }
    return params.nextHeaderPosition || null;
  };

  const handleBodyScroll = (event: BodyScrollEvent) => {
    setScrollY(event.top);
  };

  useEffect(() => {
    if (!isGridReady || !gridRef?.current?.api) {
      return;
    }

    const api = gridRef.current.api;

    if (
      !useInfiniteRowModel ||
      !parsedArtistInfo?.uri ||
      !artistHandle?.getArtistTopTracks
    ) {
      api.setGridOption("datasource", undefined);
      return;
    }

    const datasource: IDatasource = {
      getRows: async (params) => {
        const tracks = await artistHandle?.getArtistTopTracks?.(
          parsedArtistInfo.uri,
          params.startRow,
          params.endRow
        );

        const rows = tracks?.map((track) => ({
          ...track,
          trackId: getTrackId(parsedArtistInfo.source, track.uri),
          itemId: getTrackId(parsedArtistInfo.source, track.uri),
          source: parsedArtistInfo.source,
          metadataLoaded: true
        }));

        dispatch(
          addTracks({
            source: parsedArtistInfo.source,
            tracks,
            addToLibrary: false
          })
        );

        const isLast = (rows?.length ?? 0) < params.endRow - params.startRow;
        params.successCallback(
          rows ?? [],
          isLast ? params.startRow + (rows?.length ?? 0) : undefined
        );
      }
    };

    api.setGridOption("datasource", datasource);
  }, [
    artistHandle,
    dispatch,
    gridRef,
    isGridReady,
    parsedArtistInfo,
    useInfiniteRowModel
  ]);

  const infiniteModelProps = useMemo(() => {
    if (!useInfiniteRowModel) return {};
    return {
      cacheBlockSize: EXTERNAL_TRACKS_BATCH_SIZE,
      cacheOverflowSize: EXTERNAL_TRACKS_CACHE_OVERFLOW,
      maxConcurrentDatasourceRequests: EXTERNAL_TRACKS_CONCURRENT_REQUESTS
    };
  }, [useInfiniteRowModel]);

  return (
    <div
      className="track-list ag-theme-balham ag-overrides-track-list"
      style={{ width: "100%", height: "100%" }}
    >
      <div
        className={`${scrollY <= 1 ? "ag-overrides-scroll-top" : ""}`}
        style={{ display: isGridReady ? "block" : "none", height: "100%" }}
      >
        <AgGridReact
          key={useInfiniteRowModel ? "infinite" : "clientSide"}
          {...gridProps}
          {...infiniteModelProps}
          ref={gridRef}
          rowData={useInfiniteRowModel ? undefined : rowData}
          rowModelType={useInfiniteRowModel ? "infinite" : "clientSide"}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          onCellDoubleClicked={handleCellDoubleClicked}
          onSortChanged={handleSortChanged}
          onColumnMoved={handleColumnMovedOrResized}
          onColumnResized={handleColumnMovedOrResized}
          onColumnVisible={handleColumnVisible}
          onCellContextMenu={handleCellContextMenu}
          onRowDragEnd={handleRowDragEnd}
          focusGridInnerElement={handleFocusGridInnerElement}
          tabToNextHeader={handleTabToNextHeader}
          navigateToNextHeader={handleNavigateToNextHeader}
          onBodyScroll={handleBodyScroll}
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
