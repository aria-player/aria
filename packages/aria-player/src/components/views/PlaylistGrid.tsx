import { useCallback, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { useTranslation } from "react-i18next";
import {
  selectVisiblePlaylists,
  selectVisibleSearchSource,
} from "../../features/visibleSelectors";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { getExternalSearchCacheKey, getScrollbarWidth } from "../../app/utils";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { CellComponentProps, Grid, GridImperativeAPI } from "react-window";
import { useInfiniteLoader } from "react-window-infinite-loader";
import PlaylistGridItem from "./subviews/PlaylistGridItem";
import styles from "./PlaylistGrid.module.css";
import { getExternalPlaylistsHandle } from "../../features/plugins/pluginsSlice";
import {
  selectCachedSearchPlaylists,
  updateCachedSearchPlaylists,
} from "../../features/cache/cacheSlice";
import {
  selectSearch,
  selectDebouncedSearch,
} from "../../features/search/searchSlice";
import { addExternalSearchPlaylist } from "../../features/playlists/playlistsSlice";
import LoadingSpinner from "./subviews/LoadingSpinner";

const PLAYLISTS_BATCH_SIZE = 20;
const OVERSCAN_ROW_COUNT = 20;

type PlaylistGridItemProps = CellComponentProps<{
  columnCount: number;
  columnWidth: number;
  loadingSpinnerRowIndex: number | null;
  displayPlaylistLimit: number;
  displayPlaylists: ReturnType<typeof selectVisiblePlaylists>;
}>;

export default function PlaylistGrid() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { onScroll } = useScrollDetection();
  const gridRef = useRef<GridImperativeAPI | null>(null);
  const visiblePlaylists = useAppSelector(selectVisiblePlaylists);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const search = useAppSelector(selectSearch);
  const debouncedSearch = useAppSelector(selectDebouncedSearch);
  const externalPlaylistsHandle = visibleSearchSource
    ? getExternalPlaylistsHandle(visibleSearchSource)
    : null;
  const isExternalSearch =
    visibleSearchSource !== null &&
    !!externalPlaylistsHandle?.searchPlaylists &&
    !!debouncedSearch.trim();

  const searchCacheKey = useMemo(() => {
    if (!isExternalSearch || !visibleSearchSource) return "";
    return getExternalSearchCacheKey(visibleSearchSource, debouncedSearch);
  }, [isExternalSearch, visibleSearchSource, debouncedSearch]);

  const cachedSearchPlaylists = useAppSelector((state) =>
    searchCacheKey
      ? selectCachedSearchPlaylists(state, searchCacheKey)
      : undefined
  );

  const searchPlaylistOrder = useMemo(
    () => cachedSearchPlaylists || [],
    [cachedSearchPlaylists]
  );

  const [searchPlaylistsExhausted, setSearchPlaylistsExhausted] = useState<
    Record<string, boolean>
  >({});

  const hasMoreSearchPlaylists =
    !!searchCacheKey && !searchPlaylistsExhausted[searchCacheKey];

  const markSearchPlaylistsExhausted = useCallback(() => {
    if (!searchCacheKey) return;
    setSearchPlaylistsExhausted((previous) => {
      if (previous[searchCacheKey]) return previous;
      return { ...previous, [searchCacheKey]: true };
    });
  }, [searchCacheKey]);

  const placeholderCount =
    isExternalSearch && hasMoreSearchPlaylists ? PLAYLISTS_BATCH_SIZE : 0;
  const totalItemCount = isExternalSearch
    ? searchPlaylistOrder.length + placeholderCount
    : visiblePlaylists.length;

  const isInitialLoading =
    isExternalSearch &&
    searchPlaylistOrder.length === 0 &&
    hasMoreSearchPlaylists;
  const shouldShowGridLoading =
    isExternalSearch &&
    searchPlaylistOrder.length > 0 &&
    hasMoreSearchPlaylists;

  const loadSearchPlaylists = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (
        !isExternalSearch ||
        !externalPlaylistsHandle?.searchPlaylists ||
        !visibleSearchSource ||
        !searchCacheKey ||
        !hasMoreSearchPlaylists
      ) {
        return;
      }

      const fetchStopIndex = stopIndex + 1;
      if (fetchStopIndex <= startIndex) return;

      const playlists = await externalPlaylistsHandle.searchPlaylists(
        search,
        startIndex,
        fetchStopIndex
      );

      if (!playlists?.length) {
        markSearchPlaylistsExhausted();
        return;
      }

      for (const playlist of playlists) {
        dispatch(
          addExternalSearchPlaylist({
            id: playlist.id,
            name: playlist.name,
            creatorName: playlist.creatorName,
            provider: visibleSearchSource,
            artworkUri: playlist.artworkUri,
            permissions: "read",
          })
        );
      }

      dispatch(
        updateCachedSearchPlaylists({
          key: searchCacheKey,
          playlistIds: playlists.map((playlist) => playlist.id),
          offset: startIndex,
        })
      );

      const requestedCount = fetchStopIndex - startIndex;
      if (playlists.length < requestedCount) {
        markSearchPlaylistsExhausted();
      }
    },
    [
      dispatch,
      externalPlaylistsHandle,
      hasMoreSearchPlaylists,
      isExternalSearch,
      markSearchPlaylistsExhausted,
      search,
      searchCacheKey,
      visibleSearchSource,
    ]
  );

  const isRowLoaded = useCallback(
    (index: number) => {
      if (index < 0) return true;
      if (isExternalSearch) {
        return index < searchPlaylistOrder.length;
      }
      return index < visiblePlaylists.length;
    },
    [isExternalSearch, searchPlaylistOrder.length, visiblePlaylists.length]
  );

  const loadMoreRows = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (isExternalSearch) {
        return loadSearchPlaylists(startIndex, stopIndex);
      }
    },
    [isExternalSearch, loadSearchPlaylists]
  );

  const onRowsRendered = useInfiniteLoader({
    isRowLoaded,
    loadMoreRows,
    rowCount: Math.max(totalItemCount, 0),
    minimumBatchSize: PLAYLISTS_BATCH_SIZE,
    threshold: 10,
  });

  const itemRenderer = ({
    columnIndex,
    rowIndex,
    style,
    columnCount,
    columnWidth,
    loadingSpinnerRowIndex,
    displayPlaylistLimit,
    displayPlaylists,
  }: PlaylistGridItemProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const shouldRenderPlaylist = index < displayPlaylistLimit;
    const playlist = shouldRenderPlaylist ? displayPlaylists[index] : undefined;
    if (!playlist) {
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
          <div className={`playlist-grid-item ${styles.gridItem}`} />
        </div>
      );
    }
    return (
      <div key={playlist.id} style={style}>
        <div className={`playlist-grid-item ${styles.gridItem}`}>
          <PlaylistGridItem playlist={playlist} />
        </div>
      </div>
    );
  };

  return (
    <div className={`playlist-grid ${styles.grid}`}>
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
            const remainder = visiblePlaylists.length % columnCount;
            const displayPlaylistLimit = shouldShowGridLoading
              ? visiblePlaylists.length - remainder
              : visiblePlaylists.length;
            const shouldDisplayLoadingSpinner =
              shouldShowGridLoading && displayPlaylistLimit >= columnCount;
            const rowCount = Math.ceil(totalItemCount / columnCount);
            const loadingSpinnerRowIndex = shouldDisplayLoadingSpinner
              ? Math.floor(displayPlaylistLimit / columnCount)
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
                  onScroll={(event) => onScroll(event.currentTarget.scrollTop)}
                  onCellsRendered={(_, allCells) => {
                    if (!isExternalSearch) return;
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
                    displayPlaylistLimit,
                    displayPlaylists: visiblePlaylists,
                  }}
                />
              </div>
            );
          }}
        />
      ) : (
        <div className={styles.empty}>{t("search.noResults")}</div>
      )}
      {isInitialLoading && (
        <div className={styles.loading}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
