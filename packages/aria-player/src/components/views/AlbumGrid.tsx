import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import styles from "./AlbumGrid.module.css";
import { useTranslation } from "react-i18next";
import {
  selectVisibleSelectedTrackGroup,
  selectVisibleAlbums,
  selectVisibleViewType,
  selectVisibleArtistSection,
} from "../../features/visibleSelectors";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  getScrollbarWidth,
  parseArtistId,
  getAlbumId,
  getExternalSearchCacheKey,
} from "../../app/utils";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import AlbumGridOverlay from "./subviews/AlbumGridOverlay";
import { ArtistSection, View } from "../../app/view";
import { useInfiniteLoader } from "react-window-infinite-loader";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { addAlbums, selectAlbumsInfo } from "../../features/albums/albumsSlice";
import LoadingSpinner from "./subviews/LoadingSpinner";
import {
  selectCachedArtistAlbums,
  selectCachedSearchAlbums,
  updateCachedArtistAlbums,
  updateCachedSearchAlbums,
} from "../../features/cache/cacheSlice";
import {
  selectDebouncedSearch,
  selectSearch,
  selectSelectedSearchSource,
} from "../../features/search/searchSlice";
import { CellComponentProps, Grid, GridImperativeAPI } from "react-window";

type AlbumGridItemProps = CellComponentProps<{
  columnCount: number;
  columnWidth: number;
  loadingSpinnerRowIndex: number | null;
  displayAlbumLimit: number;
  displayAlbums: ReturnType<typeof selectVisibleAlbums>;
}>;

const ALBUMS_BATCH_SIZE = 20;
const OVERSCAN_ROW_COUNT = 20;

export default function AlbumGrid() {
  const dispatch = useAppDispatch();
  const { onScroll } = useScrollDetection();

  const gridRef = useRef<GridImperativeAPI | null>(null);
  const { t } = useTranslation();
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleAlbums = useAppSelector(selectVisibleAlbums);
  const visibleArtistSection = useAppSelector(selectVisibleArtistSection);
  const albumsInfo = useAppSelector(selectAlbumsInfo);

  const [artistAlbumsExhausted, setArtistAlbumsExhausted] = useState<
    Record<string, boolean>
  >({});
  const [searchAlbumsExhausted, setSearchAlbumsExhausted] = useState<
    Record<string, boolean>
  >({});

  const cachedArtistAlbums = useAppSelector((state) =>
    selectCachedArtistAlbums(state, selectedItem || "")
  );
  const artistAlbumOrder = useMemo(
    () => cachedArtistAlbums || [],
    [cachedArtistAlbums]
  );

  const search = useAppSelector(selectSearch);
  const debouncedSearch = useAppSelector(selectDebouncedSearch);
  const visibleSearchSource = useAppSelector(selectSelectedSearchSource);
  const isExternalSearchSource = visibleSearchSource !== null;
  const externalSearchHandle = isExternalSearchSource
    ? getSourceHandle(visibleSearchSource)
    : null;

  const isExternalSearch =
    visibleViewType === View.Search &&
    isExternalSearchSource &&
    !!externalSearchHandle?.searchAlbums &&
    !!debouncedSearch.trim();

  const searchCacheKey = useMemo(() => {
    if (!isExternalSearch || !visibleSearchSource) return "";
    return getExternalSearchCacheKey(visibleSearchSource, debouncedSearch);
  }, [isExternalSearch, visibleSearchSource, debouncedSearch]);

  const cachedSearchAlbums = useAppSelector((state) =>
    searchCacheKey ? selectCachedSearchAlbums(state, searchCacheKey) : undefined
  );

  const searchAlbumOrder = useMemo(
    () => cachedSearchAlbums || [],
    [cachedSearchAlbums]
  );

  const parsedArtist = useMemo(() => {
    if (visibleViewType != View.Artist || !selectedItem) return null;
    return parseArtistId(selectedItem);
  }, [selectedItem, visibleViewType]);

  const isExternalArtistView =
    visibleViewType === View.Artist &&
    visibleArtistSection === ArtistSection.Albums &&
    parsedArtist != undefined &&
    parsedArtist.uri != undefined &&
    getSourceHandle(parsedArtist.source)?.getArtistAlbums != undefined;

  const artistAlbumKey =
    isExternalArtistView && selectedItem ? selectedItem : "";
  const hasMoreArtistAlbums =
    !!artistAlbumKey && !artistAlbumsExhausted[artistAlbumKey];
  const hasMoreSearchAlbums =
    isExternalSearch &&
    !!searchCacheKey &&
    !searchAlbumsExhausted[searchCacheKey];

  const markArtistAlbumsExhausted = useCallback(() => {
    if (!artistAlbumKey) return;
    setArtistAlbumsExhausted((prev) =>
      prev[artistAlbumKey] ? prev : { ...prev, [artistAlbumKey]: true }
    );
  }, [artistAlbumKey]);

  const markSearchAlbumsExhausted = useCallback(() => {
    if (!searchCacheKey) return;
    setSearchAlbumsExhausted((prev) =>
      prev[searchCacheKey] ? prev : { ...prev, [searchCacheKey]: true }
    );
  }, [searchCacheKey]);

  const displayAlbums = useMemo(() => {
    if (isExternalSearch) {
      return searchAlbumOrder.map((albumId) => albumsInfo[albumId]);
    }
    if (isExternalArtistView) {
      return artistAlbumOrder.map((albumId) => albumsInfo[albumId]);
    }
    return visibleAlbums;
  }, [
    albumsInfo,
    artistAlbumOrder,
    searchAlbumOrder,
    isExternalArtistView,
    isExternalSearch,
    visibleAlbums,
  ]);

  const placeholderCount =
    (isExternalArtistView && hasMoreArtistAlbums) ||
    (isExternalSearch && hasMoreSearchAlbums)
      ? ALBUMS_BATCH_SIZE
      : 0;
  const totalItemCount = isExternalSearch
    ? searchAlbumOrder.length + placeholderCount
    : isExternalArtistView
      ? artistAlbumOrder.length + placeholderCount
      : visibleAlbums.length;

  const isInitialLoading =
    (isExternalArtistView &&
      artistAlbumOrder.length === 0 &&
      hasMoreArtistAlbums) ||
    (isExternalSearch && searchAlbumOrder.length === 0 && hasMoreSearchAlbums);
  const shouldShowGridLoading =
    (isExternalArtistView &&
      artistAlbumOrder.length > 0 &&
      hasMoreArtistAlbums) ||
    (isExternalSearch && searchAlbumOrder.length > 0 && hasMoreSearchAlbums);

  const loadArtistAlbums = useCallback(
    async (startIndex: number, stopIndex: number) => {
      const artistHandle = parsedArtist
        ? getSourceHandle(parsedArtist.source)
        : null;
      if (
        !isExternalArtistView ||
        !parsedArtist?.uri ||
        !artistHandle?.getArtistAlbums ||
        !hasMoreArtistAlbums
      ) {
        return;
      }

      const fetchStopIndex = stopIndex + 1;
      if (fetchStopIndex <= startIndex) return;
      const albumsMetadata = await artistHandle.getArtistAlbums(
        parsedArtist.uri,
        startIndex,
        fetchStopIndex
      );

      if (!albumsMetadata?.length) {
        markArtistAlbumsExhausted();
        return;
      }

      const albums = albumsMetadata.map((album) => ({
        ...album,
        albumId: getAlbumId(
          parsedArtist.source,
          album.name,
          album.artist,
          album.uri
        ),
        source: parsedArtist.source,
      }));

      dispatch(addAlbums({ source: parsedArtist.source, albums }));

      const newAlbumIds = albums?.map((a) => a.albumId);
      dispatch(
        updateCachedArtistAlbums({
          artistId: selectedItem!,
          albumIds: newAlbumIds,
          offset: startIndex,
        })
      );

      const requestedCount = fetchStopIndex - startIndex;
      if (albums.length < requestedCount) {
        markArtistAlbumsExhausted();
      }
    },
    [
      dispatch,
      hasMoreArtistAlbums,
      isExternalArtistView,
      markArtistAlbumsExhausted,
      parsedArtist,
      selectedItem,
    ]
  );

  const loadSearchAlbums = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (
        !isExternalSearch ||
        !externalSearchHandle?.searchAlbums ||
        !visibleSearchSource ||
        !searchCacheKey ||
        !hasMoreSearchAlbums
      ) {
        return;
      }

      const fetchStopIndex = stopIndex + 1;
      if (fetchStopIndex <= startIndex) return;

      const albumsMetadata = await externalSearchHandle.searchAlbums(
        search,
        startIndex,
        fetchStopIndex
      );

      if (!albumsMetadata?.length) {
        markSearchAlbumsExhausted();
        return;
      }

      const albums = albumsMetadata.map((album) => ({
        ...album,
        albumId: getAlbumId(
          visibleSearchSource,
          album.name ?? "",
          album.artist,
          album.uri
        ),
        source: visibleSearchSource,
      }));

      dispatch(addAlbums({ source: visibleSearchSource, albums }));

      const newAlbumIds = albums.map((a) => a.albumId);
      dispatch(
        updateCachedSearchAlbums({
          key: searchCacheKey,
          albumIds: newAlbumIds,
          offset: startIndex,
        })
      );

      const requestedCount = fetchStopIndex - startIndex;
      if (albums.length < requestedCount) {
        markSearchAlbumsExhausted();
      }
    },
    [
      dispatch,
      externalSearchHandle,
      hasMoreSearchAlbums,
      markSearchAlbumsExhausted,
      search,
      searchCacheKey,
      visibleSearchSource,
      isExternalSearch,
    ]
  );

  const isRowLoaded = useCallback(
    (index: number) => {
      if (index < 0) return true;
      if (isExternalSearch) {
        return index < searchAlbumOrder.length;
      }
      if (isExternalArtistView) {
        return index < artistAlbumOrder.length;
      }
      return index < visibleAlbums.length;
    },
    [
      artistAlbumOrder.length,
      isExternalArtistView,
      searchAlbumOrder.length,
      isExternalSearch,
      visibleAlbums.length,
    ]
  );

  const loadMoreRows = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (isExternalSearch) {
        return loadSearchAlbums(startIndex, stopIndex);
      }
      if (isExternalArtistView) {
        return loadArtistAlbums(startIndex, stopIndex);
      }
    },
    [isExternalSearch, isExternalArtistView, loadSearchAlbums, loadArtistAlbums]
  );

  const onRowsRendered = useInfiniteLoader({
    isRowLoaded,
    loadMoreRows,
    rowCount: Math.max(totalItemCount, 0),
    minimumBatchSize: ALBUMS_BATCH_SIZE,
    threshold: 10,
  });

  const itemRenderer = ({
    columnIndex,
    rowIndex,
    style,
    columnCount,
    columnWidth,
    loadingSpinnerRowIndex,
    displayAlbumLimit,
    displayAlbums,
  }: AlbumGridItemProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const shouldRenderAlbum = index < displayAlbumLimit;
    const album = shouldRenderAlbum ? displayAlbums[index] : undefined;
    if (!album) {
      const isSpinnerRow =
        loadingSpinnerRowIndex !== null && rowIndex === loadingSpinnerRowIndex;
      if (isSpinnerRow) {
        if (columnIndex === 0) {
          return (
            <div
              key={`${index}`}
              style={{
                ...style,
                width: columnWidth * columnCount,
                height: (style.height as number) * 2,
              }}
            >
              <div className={styles.gridLoadingRow}>
                <LoadingSpinner />
              </div>
            </div>
          );
        }
        return null;
      }
      return (
        <div key={`${index}`} style={style}>
          <div className={`album-grid-item ${styles.gridItem}`} />
        </div>
      );
    }
    return (
      <div key={album.albumId ?? index} style={style}>
        <div className={`album-grid-item ${styles.gridItem}`}>
          <AlbumGridItem album={album} />
        </div>
      </div>
    );
  };

  return (
    <div className={`album-grid ${styles.grid}`}>
      {totalItemCount > 0 ? (
        <AutoSizer
          renderProp={({ height, width }) => {
            if (height === undefined || width === undefined) return null;
            const widthWithoutScrollbar = width - (getScrollbarWidth() ?? 0);
            const minItemWidth = 240;
            const columnCount = Math.max(
              1,
              Math.floor(widthWithoutScrollbar / minItemWidth)
            );
            const columnWidth = widthWithoutScrollbar / columnCount;
            const rowHeight = columnWidth + 40;
            const remainder = displayAlbums.length % columnCount;
            const displayAlbumLimit = shouldShowGridLoading
              ? displayAlbums.length - remainder
              : displayAlbums.length;
            const shouldDisplayLoadingSpinner =
              shouldShowGridLoading && displayAlbumLimit >= columnCount;
            const rowCount = Math.ceil(totalItemCount / columnCount);
            const selectedIndex = displayAlbums.findIndex(
              (album) => album.albumId === selectedItem
            );
            const visibleSelectedIndex =
              displayAlbumLimit > 0 && selectedIndex >= 0
                ? Math.min(selectedIndex, displayAlbumLimit - 1)
                : -1;
            const initialRowIndex =
              visibleSelectedIndex >= 0
                ? Math.floor(visibleSelectedIndex / columnCount)
                : 0;
            const loadingSpinnerRowIndex = shouldDisplayLoadingSpinner
              ? Math.floor(displayAlbumLimit / columnCount)
              : null;

            return (
              <div style={{ width, height }}>
                <Grid
                  gridRef={gridRef}
                  rowCount={rowCount}
                  columnCount={columnCount}
                  columnWidth={columnWidth}
                  rowHeight={rowHeight}
                  defaultWidth={width}
                  defaultHeight={height}
                  style={{ overflowX: "hidden", width: "100%", height: "100%" }}
                  overscanCount={OVERSCAN_ROW_COUNT}
                  onResize={() => {
                    if (visibleSelectedIndex < 0) return;
                    gridRef.current?.scrollToRow({
                      index: initialRowIndex,
                      align: "center",
                    });
                  }}
                  onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
                  onCellsRendered={(_, allCells) => {
                    if (!isExternalArtistView && !isExternalSearch) return;
                    const startIndex = allCells.rowStartIndex * columnCount;
                    const stopIndex = Math.min(
                      totalItemCount - 1,
                      (allCells.rowStopIndex + 1) * columnCount - 1
                    );
                    if (startIndex <= stopIndex) {
                      onRowsRendered({ startIndex, stopIndex });
                    }
                  }}
                  cellComponent={itemRenderer}
                  cellProps={{
                    columnCount,
                    columnWidth,
                    loadingSpinnerRowIndex,
                    displayAlbumLimit,
                    displayAlbums,
                  }}
                />
              </div>
            );
          }}
        />
      ) : (
        <div className={styles.empty}>{t("albumGrid.empty")}</div>
      )}
      {isInitialLoading && (
        <div className={styles.loading}>
          <LoadingSpinner />
        </div>
      )}
      {selectedItem && visibleViewType != View.Artist && <AlbumGridOverlay />}
    </div>
  );
}
