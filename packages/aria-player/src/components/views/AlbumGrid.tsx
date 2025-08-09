import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectAllAlbums } from "../../features/tracks/tracksSlice";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import styles from "./AlbumGrid.module.css";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useTranslation } from "react-i18next";
import {
  selectVisiblePlaylist,
  selectVisibleSelectedTrackGroup,
  selectVisibleTrackGroups
} from "../../features/visibleSelectors";
import { useEffect, useMemo, useRef, useState } from "react";
import { getScrollbarWidth } from "../../app/utils";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";

type AlbumGridItemProps = GridChildComponentProps & {
  index: number;
};

export default function AlbumGrid() {
  const dispatch = useAppDispatch();

  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleTrackGroups = useAppSelector(selectVisibleTrackGroups);
  const allAlbums = useAppSelector(selectAllAlbums);

  const visibleAlbums = useMemo(() => {
    return allAlbums
      .filter((album) => visibleTrackGroups.includes(album.albumId))
      .sort(
        (a, b) =>
          a.album?.localeCompare(b.album!, undefined, {
            sensitivity: "base",
            ignorePunctuation: true
          }) ?? 0
      );
  }, [allAlbums, visibleTrackGroups]);

  const [overscanRowCount, setOverscanRowCount] = useState(0);

  useEffect(() => {
    setOverscanRowCount(20);
  }, []);

  function closeOverlay() {
    const path = visiblePlaylist?.id
      ? `playlist/${visiblePlaylist?.id}`
      : "albums";
    dispatch(push(BASEPATH + path));
  }

  const itemRenderer = ({ index, style }: AlbumGridItemProps) => {
    if (index >= visibleAlbums.length) return null;
    const album = visibleAlbums[index];
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
      {visibleAlbums.length > 0 ? (
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
            const rowCount = Math.ceil(visibleAlbums.length / columnCount);
            const selectedIndex = visibleAlbums.findIndex(
              (album) => album.albumId === selectedItem
            );
            const initialRowIndex =
              selectedIndex >= 0 ? Math.floor(selectedIndex / columnCount) : 0;
            const initialScrollTop =
              initialRowIndex * rowHeight - height / 2 + rowHeight / 2;

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
              >
                {({ columnIndex, rowIndex, style, data }) =>
                  itemRenderer({
                    columnIndex,
                    rowIndex,
                    style,
                    data,
                    index: rowIndex * columnCount + columnIndex
                  })
                }
              </FixedSizeGrid>
            );
          }}
        </AutoSizer>
      ) : (
        <div className={styles.empty}>{t("albumGrid.empty")}</div>
      )}
      {selectedItem && (
        <div
          className={`album-grid-overlay-background ${styles.detailOuter}`}
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              closeOverlay();
            }
          }}
        >
          <div
            className={`album-grid-overlay-foreground ${styles.detailInner}`}
          >
            <button
              className={`album-grid-overlay-back-button ${styles.backButton}`}
              onClick={() => {
                closeOverlay();
              }}
            >
              <LeftArrow />
            </button>
            <div
              className={`album-grid-album-track-list ${styles.albumTrackList}`}
            >
              <AlbumTrackList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
