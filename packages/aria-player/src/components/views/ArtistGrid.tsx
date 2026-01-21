import { useAppDispatch, useAppSelector } from "../../app/hooks";
import styles from "./ArtistGrid.module.css";
import { useTranslation } from "react-i18next";
import {
  selectVisibleArtists,
  selectVisibleSearchSource
} from "../../features/visibleSelectors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getScrollbarWidth,
  getArtistId,
  getExternalSearchCacheKey
} from "../../app/utils";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import ArtistGridItem from "./subviews/ArtistGridItem";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { useInfiniteLoader } from "react-window-infinite-loader";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import {
  addArtists,
  selectArtistsInfo
} from "../../features/artists/artistsSlice";
import LoadingSpinner from "./subviews/LoadingSpinner";
import {
  selectCachedSearchArtists,
  updateCachedSearchArtists
} from "../../features/cache/cacheSlice";
import {
  selectSearch,
  selectDebouncedSearch
} from "../../features/search/searchSlice";

const ARTISTS_BATCH_SIZE = 20;

type ArtistGridItemProps = GridChildComponentProps & {
  columnCount: number;
  columnWidth: number;
  loadingSpinnerRowIndex: number | null;
  displayArtistLimit: number;
};

export default function ArtistGrid() {
  const dispatch = useAppDispatch();
  const { onScroll } = useScrollDetection();

  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const visibleArtists = useAppSelector(selectVisibleArtists);
  const artistsInfo = useAppSelector(selectArtistsInfo);

  const [overscanRowCount, setOverscanRowCount] = useState(0);
  const [hasMoreSearchArtists, setHasMoreSearchArtists] = useState(true);

  const search = useAppSelector(selectSearch);
  const debouncedSearch = useAppSelector(selectDebouncedSearch);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const isExternalSearchSource = visibleSearchSource !== null;
  const externalSearchHandle = isExternalSearchSource
    ? getSourceHandle(visibleSearchSource)
    : null;

  const isExternalSearch =
    isExternalSearchSource &&
    !!externalSearchHandle?.searchArtists &&
    !!debouncedSearch.trim();

  const searchCacheKey = useMemo(() => {
    if (!isExternalSearch || !visibleSearchSource) return "";
    return getExternalSearchCacheKey(visibleSearchSource, debouncedSearch);
  }, [isExternalSearch, visibleSearchSource, debouncedSearch]);

  const cachedSearchArtists = useAppSelector((state) =>
    searchCacheKey
      ? selectCachedSearchArtists(state, searchCacheKey)
      : undefined
  );

  const searchArtistOrder = useMemo(
    () => cachedSearchArtists || [],
    [cachedSearchArtists]
  );

  useEffect(() => {
    setOverscanRowCount(20);
  }, []);

  useEffect(() => {
    setHasMoreSearchArtists(isExternalSearch);
  }, [isExternalSearch, searchCacheKey]);

  const displayArtists = useMemo(() => {
    if (isExternalSearch) {
      return searchArtistOrder.map((artistId) => artistsInfo[artistId]);
    }
    return visibleArtists;
  }, [artistsInfo, searchArtistOrder, isExternalSearch, visibleArtists]);

  const placeholderCount =
    isExternalSearch && hasMoreSearchArtists ? ARTISTS_BATCH_SIZE : 0;
  const totalItemCount = isExternalSearch
    ? searchArtistOrder.length + placeholderCount
    : visibleArtists.length;

  const isInitialLoading =
    isExternalSearch && searchArtistOrder.length === 0 && hasMoreSearchArtists;
  const shouldShowGridLoading =
    isExternalSearch && searchArtistOrder.length > 0 && hasMoreSearchArtists;

  const loadSearchArtists = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (
        !isExternalSearch ||
        !externalSearchHandle?.searchArtists ||
        !visibleSearchSource ||
        !searchCacheKey ||
        !hasMoreSearchArtists
      ) {
        return;
      }

      const fetchStopIndex = stopIndex + 1;
      if (fetchStopIndex <= startIndex) return;

      const artistsMetadata = await externalSearchHandle.searchArtists(
        search,
        startIndex,
        fetchStopIndex
      );

      if (!artistsMetadata?.length) {
        setHasMoreSearchArtists(false);
        return;
      }

      const artists = artistsMetadata.map((artist) => ({
        ...artist,
        artistId: getArtistId(visibleSearchSource, artist.name, artist.uri),
        source: visibleSearchSource
      }));

      dispatch(addArtists({ source: visibleSearchSource, artists }));

      const newArtistIds = artists.map((a) => a.artistId);
      dispatch(
        updateCachedSearchArtists({
          key: searchCacheKey,
          artistIds: newArtistIds,
          offset: startIndex
        })
      );

      const requestedCount = fetchStopIndex - startIndex;
      if (artists.length < requestedCount) {
        setHasMoreSearchArtists(false);
      }
    },
    [
      dispatch,
      externalSearchHandle,
      hasMoreSearchArtists,
      search,
      searchCacheKey,
      visibleSearchSource,
      isExternalSearch
    ]
  );

  const isRowLoaded = useCallback(
    (index: number) => {
      if (index < 0) return true;
      if (isExternalSearch) {
        return index < searchArtistOrder.length;
      }
      return index < visibleArtists.length;
    },
    [searchArtistOrder.length, isExternalSearch, visibleArtists.length]
  );

  const loadMoreRows = useCallback(
    async (startIndex: number, stopIndex: number) => {
      if (isExternalSearch) {
        return loadSearchArtists(startIndex, stopIndex);
      }
    },
    [isExternalSearch, loadSearchArtists]
  );

  const onRowsRendered = useInfiniteLoader({
    isRowLoaded,
    loadMoreRows,
    rowCount: Math.max(totalItemCount, 0),
    minimumBatchSize: ARTISTS_BATCH_SIZE,
    threshold: 10
  });

  const itemRenderer = ({
    columnIndex,
    rowIndex,
    style,
    columnCount,
    columnWidth,
    loadingSpinnerRowIndex,
    displayArtistLimit
  }: ArtistGridItemProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const shouldRenderArtist = index < displayArtistLimit;
    const artist = shouldRenderArtist ? displayArtists[index] : undefined;
    if (!artist) {
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
                height: (style.height as number) * 2
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
          <div className={`artist-grid-item ${styles.gridItem}`} />
        </div>
      );
    }
    return (
      <div key={artist.artistId ?? index} style={style}>
        <div className={`artist-grid-item ${styles.gridItem}`}>
          <ArtistGridItem artist={artist} />
        </div>
      </div>
    );
  };

  return (
    <div className={`artist-grid ${styles.grid}`}>
      {totalItemCount > 0 ? (
        <AutoSizer>
          {({ height, width }) => {
            const widthWithoutScrollbar = width - (getScrollbarWidth() ?? 0);
            const minItemWidth = 240;
            const columnCount = Math.max(
              1,
              Math.floor(widthWithoutScrollbar / minItemWidth)
            );
            const columnWidth = widthWithoutScrollbar / columnCount;
            const rowHeight = columnWidth + 40;
            const remainder = displayArtists.length % columnCount;
            const displayArtistLimit = shouldShowGridLoading
              ? displayArtists.length - remainder
              : displayArtists.length;
            const shouldDisplayLoadingSpinner =
              shouldShowGridLoading && displayArtistLimit >= columnCount;
            const rowCount = Math.ceil(totalItemCount / columnCount);
            const loadingSpinnerRowIndex = shouldDisplayLoadingSpinner
              ? Math.floor(displayArtistLimit / columnCount)
              : null;

            return (
              <FixedSizeGrid
                ref={fixedSizeGridRef}
                width={width}
                height={height}
                rowCount={rowCount}
                columnCount={columnCount}
                columnWidth={columnWidth}
                rowHeight={rowHeight}
                style={{ overflowX: "hidden" }}
                overscanRowCount={overscanRowCount}
                onScroll={({ scrollTop }) => onScroll(scrollTop)}
                onItemsRendered={({
                  overscanRowStartIndex,
                  overscanRowStopIndex
                }) => {
                  if (!isExternalSearch) return;
                  const startIndex = overscanRowStartIndex * columnCount;
                  const stopIndex = Math.min(
                    totalItemCount - 1,
                    (overscanRowStopIndex + 1) * columnCount - 1
                  );
                  if (startIndex <= stopIndex) {
                    onRowsRendered({ startIndex, stopIndex });
                  }
                }}
              >
                {({ columnIndex, rowIndex, style, data }) =>
                  itemRenderer({
                    columnIndex,
                    rowIndex,
                    style,
                    data,
                    columnCount,
                    columnWidth,
                    loadingSpinnerRowIndex,
                    displayArtistLimit
                  })
                }
              </FixedSizeGrid>
            );
          }}
        </AutoSizer>
      ) : (
        <div className={styles.empty}>{t("artistGrid.empty")}</div>
      )}
      {isInitialLoading && (
        <div className={styles.loading}>
          <LoadingSpinner />
        </div>
      )}
    </div>
  );
}
