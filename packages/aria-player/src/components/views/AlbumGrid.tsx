import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import styles from "./AlbumGrid.module.css";
import { useTranslation } from "react-i18next";
import {
  selectVisibleSelectedTrackGroup,
  selectVisibleAlbums,
  selectVisibleViewType,
  selectVisibleArtistSection
} from "../../features/visibleSelectors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getScrollbarWidth, parseArtistId, getAlbumId } from "../../app/utils";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import AlbumGridOverlay from "./subviews/AlbumGridOverlay";
import { ArtistSection, View } from "../../app/view";
import { useInfiniteLoader } from "react-window-infinite-loader";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { addAlbums, selectAlbumsInfo } from "../../features/albums/albumsSlice";
import { AlbumId } from "../../../../types";
import LoadingSpinner from "./subviews/LoadingSpinner";

type AlbumGridItemProps = GridChildComponentProps & {
  columnCount: number;
  columnWidth: number;
  loadingSpinnerRowIndex: number | null;
  displayAlbumLimit: number;
};

const ARTIST_ALBUMS_BATCH_SIZE = 20;

export default function AlbumGrid() {
  const dispatch = useAppDispatch();
  const { onScroll } = useScrollDetection();

  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleAlbums = useAppSelector(selectVisibleAlbums);
  const visibleArtistSection = useAppSelector(selectVisibleArtistSection);
  const albumsInfo = useAppSelector(selectAlbumsInfo);

  const [overscanRowCount, setOverscanRowCount] = useState(0);
  const [artistAlbumOrder, setArtistAlbumOrder] = useState<AlbumId[]>([]);
  const [hasMoreArtistAlbums, setHasMoreArtistAlbums] = useState(true);

  useEffect(() => {
    setOverscanRowCount(20);
  }, []);

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

  useEffect(() => {
    setArtistAlbumOrder([]);
    setHasMoreArtistAlbums(isExternalArtistView);
  }, [isExternalArtistView, selectedItem]);

  const displayAlbums = useMemo(() => {
    if (isExternalArtistView) {
      return artistAlbumOrder.map((albumId) => albumsInfo[albumId]);
    }
    return visibleAlbums;
  }, [albumsInfo, artistAlbumOrder, isExternalArtistView, visibleAlbums]);

  const placeholderCount =
    isExternalArtistView && hasMoreArtistAlbums ? ARTIST_ALBUMS_BATCH_SIZE : 0;
  const totalItemCount = isExternalArtistView
    ? artistAlbumOrder.length + placeholderCount
    : visibleAlbums.length;

  const isInitialLoading =
    isExternalArtistView &&
    artistAlbumOrder.length === 0 &&
    hasMoreArtistAlbums;
  const shouldShowGridLoading =
    isExternalArtistView && artistAlbumOrder.length > 0 && hasMoreArtistAlbums;

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
        setHasMoreArtistAlbums(false);
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
        source: parsedArtist.source
      }));

      dispatch(addAlbums({ source: parsedArtist.source, albums }));

      setArtistAlbumOrder((prev) => {
        const ordered = new Set(prev);
        albums.forEach((album) => ordered.add(album.albumId));
        return Array.from(ordered);
      });

      const requestedCount = fetchStopIndex - startIndex;
      if (albums.length < requestedCount) {
        setHasMoreArtistAlbums(false);
      }
    },
    [dispatch, hasMoreArtistAlbums, isExternalArtistView, parsedArtist]
  );

  const isRowLoaded = useCallback(
    (index: number) => {
      if (index < 0) return true;
      if (isExternalArtistView) {
        return index < artistAlbumOrder.length;
      }
      return index < visibleAlbums.length;
    },
    [artistAlbumOrder.length, isExternalArtistView, visibleAlbums.length]
  );

  const onRowsRendered = useInfiniteLoader({
    isRowLoaded,
    loadMoreRows: loadArtistAlbums,
    rowCount: Math.max(totalItemCount, 0),
    minimumBatchSize: ARTIST_ALBUMS_BATCH_SIZE,
    threshold: 10
  });

  const itemRenderer = ({
    columnIndex,
    rowIndex,
    style,
    columnCount,
    columnWidth,
    loadingSpinnerRowIndex,
    displayAlbumLimit
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
            const initialScrollTop =
              initialRowIndex * rowHeight - height / 2 + rowHeight / 2;
            const loadingSpinnerRowIndex = shouldDisplayLoadingSpinner
              ? Math.floor(displayAlbumLimit / columnCount)
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
                initialScrollTop={initialScrollTop}
                style={{ overflowX: "hidden" }}
                overscanRowCount={overscanRowCount}
                onScroll={({ scrollTop }) => onScroll(scrollTop)}
                onItemsRendered={({
                  overscanRowStartIndex,
                  overscanRowStopIndex
                }) => {
                  if (!isExternalArtistView) return;
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
                    displayAlbumLimit
                  })
                }
              </FixedSizeGrid>
            );
          }}
        </AutoSizer>
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
