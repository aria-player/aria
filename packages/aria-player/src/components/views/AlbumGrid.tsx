import { useAppSelector } from "../../app/hooks";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import styles from "./AlbumGrid.module.css";
import { useTranslation } from "react-i18next";
import {
  selectVisibleSelectedTrackGroup,
  selectVisibleAlbums
} from "../../features/visibleSelectors";
import { useEffect, useRef, useState } from "react";
import { getScrollbarWidth } from "../../app/utils";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import AlbumGridOverlay from "./subviews/AlbumGridOverlay";

type AlbumGridItemProps = GridChildComponentProps & {
  index: number;
};

export default function AlbumGrid() {
  const { onScroll } = useScrollDetection();

  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleAlbums = useAppSelector(selectVisibleAlbums);

  const [overscanRowCount, setOverscanRowCount] = useState(0);

  useEffect(() => {
    setOverscanRowCount(20);
  }, []);

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
                onScroll={({ scrollTop }) => onScroll(scrollTop)}
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
      {selectedItem && <AlbumGridOverlay />}
    </div>
  );
}
