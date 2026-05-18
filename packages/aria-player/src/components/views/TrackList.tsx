import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AgGridReact } from "ag-grid-react";
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
  TabToNextHeaderParams,
} from "ag-grid-community";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  setLibraryColumnState,
  selectLibraryColumnState,
} from "../../features/library/librarySlice";
import { defaultColumnDefinitions } from "../../features/library/libraryColumns";
import {
  selectQueueSource,
  setQueueToNewSource,
  updateQueueAfterChange,
} from "../../features/player/playerSlice";

import { useTranslation } from "react-i18next";
import { TriggerEvent, useContextMenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import {
  reorderPlaylistTracksThunk,
  selectPlaylistConfigById,
  setPlaylistTracks,
  updatePlaylistColumnState,
} from "../../features/playlists/playlistsSlice";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";
import { ArtistSection, LibraryView, View } from "../../app/view";
import {
  filterHiddenColumnSort,
  getRelativePath,
  getTrackId,
  parseArtistId,
  parseTrackId,
  overrideColumnStateSort,
  getExternalSearchCacheKey,
  getAlbumId,
} from "../../app/utils";
import { store } from "../../app/store";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { useIsMobileBrowser } from "../../hooks/useIsMobileBrowser";
import {
  selectCurrentTrack,
  selectCurrentPlaylist,
} from "../../features/currentSelectors";
import { selectSortedTrackList } from "../../features/genericSelectors";
import {
  selectVisibleTracks,
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisiblePlaylistConfig,
  selectVisibleSelectedTrackGroup,
  selectVisibleArtistSection,
  selectVisibleSearchTracks,
} from "../../features/visibleSelectors";
import { compareMetadata } from "../../app/sort";
import {
  addToSearchHistory,
  selectSearch,
  selectDebouncedSearch,
  selectSelectedSearchSource,
} from "../../features/search/searchSlice";
import NoRowsOverlay from "./subviews/NoRowsOverlay";
import {
  getExternalPlaylistsHandle,
  getSourceHandle,
} from "../../features/plugins/pluginsSlice";
import { addTracks, selectTrackById } from "../../features/tracks/tracksSlice";
import { TrackMetadata } from "../../../../types/tracks";
import { useLocation } from "react-router-dom";
import LoadingSpinner from "./subviews/LoadingSpinner";
import {
  fetchPlaylistTracks,
  fetchPlaylistTrackUrisPage,
  initExternalPlaylist,
  PLAYLIST_URI_PAGE_SIZE,
} from "../../features/playlists/playlistsSlice";
import {
  selectCachedArtistTopTracks,
  selectCachedPlaylistTrackUris,
  selectCachedSearchTracks,
  updateCachedArtistTopTracks,
  updateCachedSearchTracks,
} from "../../features/cache/cacheSlice";

const EXTERNAL_TRACKS_BATCH_SIZE = 20;
const EXTERNAL_TRACKS_CACHE_OVERFLOW = 20;
const EXTERNAL_TRACKS_CONCURRENT_REQUESTS = 4;
const PLAYLIST_METADATA_LOOKAHEAD = 40;

export const TrackList = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { gridRef, gridProps, isGridReady, setIsGridReady } = useTrackGrid();
  const currentTrack = useAppSelector(selectCurrentTrack);
  const rowData = useAppSelector(selectVisibleTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const currentPlaylistId = visiblePlaylist?.id;
  const provider = visiblePlaylist?.provider;
  const playlistSourceHandle = provider ? getSourceHandle(provider) : null;
  const canFetchPlaylistTracksByUri = !!playlistSourceHandle?.getTracksByUri;
  const cachedPlaylistUris = useAppSelector((state) =>
    currentPlaylistId
      ? selectCachedPlaylistTrackUris(state, currentPlaylistId)
      : null
  );
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleArtistSection = useAppSelector(selectVisibleArtistSection);
  const selectedArtistGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const queueSource = useAppSelector(selectQueueSource);
  const { setMenuData } = useContext(MenuContext);
  const { show: showHeaderContextMenu } = useContextMenu({
    id: "tracklistheader",
  });
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem",
  });
  const visibleView = visiblePlaylist?.id ?? visibleViewType;
  const [scrollY, setScrollY] = useState(0);
  const { t } = useTranslation();
  const libraryColumnState = useAppSelector(selectLibraryColumnState);
  const playlistConfig = useAppSelector(selectVisiblePlaylistConfig);
  const isMobileBrowser = useIsMobileBrowser();

  const parsedArtistInfo = useMemo(() => {
    if (visibleViewType !== View.Artist || !selectedArtistGroup) return null;
    return parseArtistId(selectedArtistGroup);
  }, [selectedArtistGroup, visibleViewType]);

  const artistHandle = parsedArtistInfo
    ? getSourceHandle(parsedArtistInfo.source)
    : null;

  const debouncedSearch = useAppSelector(selectDebouncedSearch);
  const visibleSearchSource = useAppSelector(selectSelectedSearchSource);
  const isExternalSearchSource = visibleSearchSource !== null;
  const externalSearchHandle = isExternalSearchSource
    ? getSourceHandle(visibleSearchSource)
    : null;

  const useInfiniteRowModelForArtist =
    visibleViewType === View.Artist &&
    visibleArtistSection === ArtistSection.Songs &&
    !!parsedArtistInfo?.uri &&
    !!artistHandle?.getArtistTopTracks;

  const useInfiniteRowModelForSearch =
    visibleViewType === View.Search &&
    isExternalSearchSource &&
    !!externalSearchHandle?.searchTracks &&
    !!debouncedSearch.trim();

  const isExternalPlaylist = !!provider && canFetchPlaylistTracksByUri;
  const [fetchedPlaylistId, setFetchedPlaylistId] = useState<string | null>(
    null
  );
  const isProviderPlaylistInitializing =
    isExternalPlaylist &&
    (cachedPlaylistUris == null || fetchedPlaylistId !== currentPlaylistId);

  const tracksEntities = useAppSelector(
    (state) => state.tracks.tracks.entities
  );

  const externalPlaylistRowData = useMemo(() => {
    if (!isExternalPlaylist || !currentPlaylistId || !cachedPlaylistUris)
      return null;
    const { uris, ids, total } = cachedPlaylistUris;
    return Array.from({ length: total }, (_, i) => {
      const itemId = ids?.[i] ?? `${currentPlaylistId}:${i}`;
      const uri = uris?.[i];
      if (!uri) return { itemId, metadataLoaded: false };
      const trackId = getTrackId(provider!, uri);
      const track = tracksEntities[trackId];
      if (!track) return { itemId, metadataLoaded: false };
      return {
        ...track,
        itemId,
        albumId: track.albumUri
          ? getAlbumId(
              provider!,
              track.album!,
              track.albumArtist,
              track.albumUri
            )
          : undefined,
        metadataLoaded: true,
      };
    });
  }, [
    isExternalPlaylist,
    currentPlaylistId,
    cachedPlaylistUris,
    provider,
    tracksEntities,
  ]);

  const fetchingTrackUris = useRef(new Set<string>());
  const prevCachedPlaylistUrisRef = useRef<
    typeof cachedPlaylistUris | undefined
  >(undefined);

  useEffect(() => {
    fetchingTrackUris.current.clear();
  }, [currentPlaylistId]);

  useEffect(() => {
    const prev = prevCachedPlaylistUrisRef.current;
    prevCachedPlaylistUrisRef.current = cachedPlaylistUris;
    if (prev !== null || cachedPlaylistUris == null) return;
    const api = gridRef?.current?.api;
    if (!api) return;
    const timeout = window.setTimeout(() => {
      if (!api.isDestroyed() && api.getDisplayedRowCount() > 0) {
        api.ensureIndexVisible(0, "top");
      }
    }, 0);
    return () => clearTimeout(timeout);
  }, [cachedPlaylistUris, gridRef]);

  const fetchVisibleTrackMetadata = useCallback(async () => {
    if (
      !isExternalPlaylist ||
      !provider ||
      !playlistSourceHandle?.getTracksByUri ||
      !gridRef?.current?.api
    )
      return;
    const api = gridRef.current.api;
    if (api.isDestroyed()) return;
    const first = api.getFirstDisplayedRowIndex();
    const last = Math.min(
      api.getLastDisplayedRowIndex() + PLAYLIST_METADATA_LOOKAHEAD,
      api.getDisplayedRowCount() - 1
    );
    const urisToFetch: string[] = [];
    for (let i = first; i <= last; i++) {
      const node = api.getDisplayedRowAtIndex(i);
      const uri: string | undefined = cachedPlaylistUris?.uris[i] ?? undefined;
      if (
        uri &&
        !node?.data?.metadataLoaded &&
        !fetchingTrackUris.current.has(uri)
      ) {
        urisToFetch.push(uri);
        fetchingTrackUris.current.add(uri);
      }
    }
    if (urisToFetch.length === 0) return;
    const tracks = await playlistSourceHandle.getTracksByUri(urisToFetch);
    if (tracks?.length) {
      dispatch(addTracks({ source: provider, tracks, addToLibrary: false }));
    }
  }, [
    isExternalPlaylist,
    provider,
    playlistSourceHandle,
    gridRef,
    cachedPlaylistUris,
    dispatch,
  ]);

  useEffect(() => {
    if (!isGridReady || !isExternalPlaylist || !cachedPlaylistUris) return;
    fetchVisibleTrackMetadata().then(() =>
      setFetchedPlaylistId(currentPlaylistId ?? null)
    );
  }, [
    isGridReady,
    isExternalPlaylist,
    cachedPlaylistUris,
    fetchVisibleTrackMetadata,
    currentPlaylistId,
  ]);

  const useInfiniteRowModel =
    useInfiniteRowModelForArtist || useInfiniteRowModelForSearch;

  useLayoutEffect(
    () => setIsGridReady(false),
    [setIsGridReady, useInfiniteRowModel]
  );

  const columnDefs = useMemo<ColDef[]>(() => {
    const defs = defaultColumnDefinitions
      .map((colDef) => {
        let colDefOverrides = {
          ...libraryColumnState?.find((col) => col.colId == colDef.field),
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
            ),
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

        const mutableColDefOverrides = colDefOverrides as Record<
          string,
          unknown
        >;
        delete mutableColDefOverrides.sortType;
        delete mutableColDefOverrides.rowGroup;
        delete mutableColDefOverrides.pivot;
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
              : colDef.field,
        };
      })
      .sort((colDefA, colDefB) => {
        const orderedColumns =
          playlistConfig?.useCustomLayout && playlistConfig?.columnState
            ? playlistConfig.columnState
            : libraryColumnState;
        if (!orderedColumns) return 0;
        const indexA = orderedColumns.findIndex(
          (libraryCol) => libraryCol.colId === colDefA.field
        );
        const indexB = orderedColumns.findIndex(
          (libraryCol) => libraryCol.colId === colDefB.field
        );
        if (indexA < 0) return 1;
        if (indexB < 0) return -1;
        return indexA - indexB;
      });

    if (isMobileBrowser && !libraryColumnState) {
      const mobileOrder = ["art", "title", "artist", "duration"];
      const mobileVisible = new Set(mobileOrder);
      const mapped = defs.map((colDef) => ({
        ...colDef,
        hide: !mobileVisible.has(colDef.field as string),
        ...(colDef.field === "duration" ? { flex: 0.35 } : {}),
      }));
      return mapped.sort((a, b) => {
        const ia = mobileOrder.indexOf(a.field as string);
        const ib = mobileOrder.indexOf(b.field as string);
        if (ia < 0 && ib < 0) return 0;
        if (ia < 0) return 1;
        if (ib < 0) return -1;
        return ia - ib;
      });
    }
    return defs;
  }, [libraryColumnState, t, visibleViewType, playlistConfig, isMobileBrowser]);

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
          fontStyle: !params.data?.metadataLoaded ? "italic" : "normal",
        };
      },
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
          columnState: newColumnState,
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
            ),
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
    if (event.api.getGridOption("rowModelType") === "clientSide") {
      event.api.forEachNodeAfterFilterAndSort((node) => {
        queue.push({
          itemId: node.data.itemId,
          trackId: node.data.trackId,
        });
      });
    } else {
      const state = store.getState();
      if (visibleViewType == View.Search) {
        selectVisibleSearchTracks(state).forEach((track) => {
          queue.push({
            itemId: track.itemId,
            trackId: track.trackId,
          });
        });
      } else {
        const cachedTracks =
          selectCachedArtistTopTracks(state, selectedArtistGroup!) || [];
        for (const trackId of cachedTracks) {
          queue.push({ itemId: trackId, trackId });
        }
      }
    }
    if (visibleView == View.Search) {
      dispatch(addToSearchHistory(search));
    }
    dispatch(
      setQueueToNewSource({
        queue,
        queueIndex: event.rowIndex ?? 0,
        queueSource: getRelativePath(location.pathname),
        queueGrouping: null,
        queueSelectedGroup: null,
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
          columnState: params.api.getColumnState(),
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
        force: true,
      });
  }, [gridRef, currentTrack]);

  useEffect(() => {
    if (!useInfiniteRowModel && gridRef?.current?.api) {
      gridRef.current.api.refreshCells({
        force: true,
      });
    }
  }, [gridRef, rowData, useInfiniteRowModel]);

  useEffect(() => {
    const headerContextArea = document.querySelector(".ag-header");
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      showHeaderContextMenu({
        event: e as TriggerEvent,
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
        type: "tracklistitem",
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
    if (isExternalPlaylist) {
      const newUris: (string | null)[] = [];
      event.api.forEachNode((node) => {
        const trackId = node.data?.trackId;
        newUris.push(trackId ? (parseTrackId(trackId)?.uri ?? null) : null);
      });
      dispatch(reorderPlaylistTracksThunk(visiblePlaylist.id, newUris));
      return;
    }
    const newOrder = [] as PlaylistItem[];
    event.api.forEachNode((node) => {
      if (node.data) {
        newOrder.push({
          itemId: node.data.itemId,
          trackId: node.data.trackId,
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
    } else {
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
    if (isExternalPlaylist) fetchVisibleTrackMetadata();
  };

  const createDatasource = useCallback(
    (
      api: GridApi,
      {
        getCachedTrackIds,
        fetchTracks,
        source,
        onCacheUpdate,
      }: {
        getCachedTrackIds: () => string[];
        fetchTracks: (
          startRow: number,
          endRow: number
        ) => Promise<TrackMetadata[]>;
        source: string;
        onCacheUpdate: (trackIds: string[], offset: number) => void;
      }
    ): IDatasource => ({
      getRows: async (params) => {
        const currentCachedTracks = getCachedTrackIds() || [];
        const cachedCount = currentCachedTracks.length;
        const requestedCachedTracks = currentCachedTracks.slice(
          params.startRow,
          Math.min(params.endRow, cachedCount)
        );

        if (requestedCachedTracks.length > 0) {
          const cachedRows = requestedCachedTracks
            .map((trackId) => {
              const track = selectTrackById(store.getState(), trackId);
              return track
                ? { ...track, itemId: trackId, metadataLoaded: true }
                : null;
            })
            .filter(Boolean);
          params.successCallback(
            cachedRows,
            cachedCount < params.endRow ? cachedCount : undefined
          );
          api.setGridOption("loading", false);
          return;
        }

        const tracks = await fetchTracks(params.startRow, params.endRow);

        if (tracks?.length) {
          dispatch(addTracks({ source, tracks, addToLibrary: false }));
          const newTrackIds = tracks.map((track) =>
            getTrackId(source, track.uri)
          );
          onCacheUpdate(newTrackIds, params.startRow);

          const state = store.getState();
          const rows = tracks.map((track) => {
            const trackId = getTrackId(source, track.uri);
            return {
              ...selectTrackById(state, trackId),
              albumId: getAlbumId(
                source,
                track.album!,
                track.albumArtist,
                track.albumUri
              ),
              itemId: trackId,
            };
          });
          const isLast = rows.length < params.endRow - params.startRow;
          params.successCallback(
            rows,
            isLast ? params.startRow + rows.length : undefined
          );
        } else {
          const inferredRowCount = Math.max(cachedCount, params.startRow);
          params.successCallback([], inferredRowCount);
        }

        if (!api.isDestroyed()) {
          api.setGridOption("loading", false);
        }
      },
    }),
    [dispatch]
  );

  useEffect(() => {
    if (!isGridReady || !gridRef?.current?.api) {
      return;
    }

    const api = gridRef.current.api;

    if (
      !useInfiniteRowModelForArtist ||
      !parsedArtistInfo?.uri ||
      !artistHandle?.getArtistTopTracks
    ) {
      if (!useInfiniteRowModelForSearch) {
        api.setGridOption("loading", false);
        api.setGridOption("datasource", undefined);
      }
      return;
    }

    api.setGridOption("loading", true);

    const datasource = createDatasource(api, {
      getCachedTrackIds: () =>
        selectCachedArtistTopTracks(store.getState(), selectedArtistGroup!) ||
        [],
      fetchTracks: async (startRow, endRow) =>
        (await artistHandle?.getArtistTopTracks?.(
          parsedArtistInfo.uri,
          startRow,
          endRow
        )) ?? [],
      source: parsedArtistInfo.source,
      onCacheUpdate: (trackIds, offset) =>
        dispatch(
          updateCachedArtistTopTracks({
            artistId: selectedArtistGroup!,
            trackIds,
            offset,
          })
        ),
    });

    api.setGridOption("datasource", datasource);
  }, [
    artistHandle,
    dispatch,
    gridRef,
    isGridReady,
    parsedArtistInfo,
    useInfiniteRowModel,
    selectedArtistGroup,
    useInfiniteRowModelForSearch,
    useInfiniteRowModelForArtist,
    createDatasource,
  ]);

  useEffect(() => {
    if (!isGridReady || !gridRef?.current?.api) {
      return;
    }

    const api = gridRef.current.api;

    if (
      !useInfiniteRowModelForSearch ||
      !externalSearchHandle?.searchTracks ||
      !debouncedSearch.trim() ||
      !visibleSearchSource
    ) {
      if (!useInfiniteRowModelForArtist) {
        api.setGridOption("loading", false);
        api.setGridOption("datasource", undefined);
      }
      return;
    }

    api.setGridOption("loading", true);

    const cacheKey = getExternalSearchCacheKey(
      visibleSearchSource,
      debouncedSearch
    );

    const datasource = createDatasource(api, {
      getCachedTrackIds: () =>
        selectCachedSearchTracks(store.getState(), cacheKey) || [],
      fetchTracks: async (startRow, endRow) =>
        (await externalSearchHandle?.searchTracks?.(
          debouncedSearch,
          startRow,
          endRow
        )) ?? [],
      source: visibleSearchSource,
      onCacheUpdate: (trackIds, offset) =>
        dispatch(
          updateCachedSearchTracks({
            key: cacheKey,
            trackIds,
            offset,
          })
        ),
    });

    api.setGridOption("datasource", datasource);
  }, [
    dispatch,
    externalSearchHandle,
    gridRef,
    isGridReady,
    debouncedSearch,
    visibleSearchSource,
    useInfiniteRowModelForArtist,
    useInfiniteRowModelForSearch,
    createDatasource,
  ]);

  useEffect(() => {
    if (!provider || !currentPlaylistId) return;
    const plugin = getExternalPlaylistsHandle(provider);
    if (!plugin) return;
    if (canFetchPlaylistTracksByUri) {
      dispatch(
        initExternalPlaylist({ playlistId: currentPlaylistId, provider })
      ).then((result) => {
        if (result.meta.requestStatus !== "fulfilled") return;
        const { total } = result.payload as { uris: string[]; total: number };
        let offset = PLAYLIST_URI_PAGE_SIZE;
        const fetchNext = () => {
          if (offset >= total) return;
          dispatch(
            fetchPlaylistTrackUrisPage({
              playlistId: currentPlaylistId,
              provider,
              offset,
            })
          ).then(() => {
            offset += PLAYLIST_URI_PAGE_SIZE;
            fetchNext();
          });
        };
        fetchNext();
      });
    } else {
      dispatch(
        fetchPlaylistTracks({ playlistId: currentPlaylistId, provider })
      );
    }
  }, [provider, currentPlaylistId, canFetchPlaylistTracksByUri, dispatch]);

  const infiniteModelProps = useMemo(() => {
    if (!useInfiniteRowModel) return {};
    return {
      cacheBlockSize: EXTERNAL_TRACKS_BATCH_SIZE,
      cacheOverflowSize: EXTERNAL_TRACKS_CACHE_OVERFLOW,
      maxConcurrentDatasourceRequests: EXTERNAL_TRACKS_CONCURRENT_REQUESTS,
    };
  }, [useInfiniteRowModel]);

  const activeRowData =
    externalPlaylistRowData ?? (useInfiniteRowModel ? undefined : rowData);

  return (
    <div
      className="track-list ag-theme-balham ag-overrides-track-list"
      style={{ width: "100%", height: "100%", position: "relative" }}
    >
      {isProviderPlaylistInitializing && <LoadingSpinner />}
      <div
        className={`${scrollY <= 1 ? "ag-overrides-scroll-top" : ""}`}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display:
            isGridReady && !(isExternalPlaylist && cachedPlaylistUris == null)
              ? "block"
              : "none",
          visibility: isProviderPlaylistInitializing ? "hidden" : "visible",
        }}
      >
        <AgGridReact
          key={useInfiniteRowModel ? "infinite" : "clientSide"}
          {...gridProps}
          {...infiniteModelProps}
          ref={gridRef}
          rowData={activeRowData}
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
          rowDragManaged={
            visibleViewType == View.Playlist &&
            visiblePlaylist?.orderable !== false &&
            (!isExternalPlaylist ||
              visiblePlaylist?.permissions == "write" ||
              visiblePlaylist?.permissions == "manage")
          }
          noRowsOverlayComponent={NoRowsOverlay}
          loadingOverlayComponent={LoadingSpinner}
          multiSortKey="ctrl"
          rowDragEntireRow
          suppressDragLeaveHidesColumns
          suppressMoveWhenRowDragging
        />
      </div>
    </div>
  );
};
