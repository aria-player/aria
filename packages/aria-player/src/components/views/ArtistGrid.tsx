import { useAppSelector } from "../../app/hooks";
import styles from "./ArtistGrid.module.css";
import { useTranslation } from "react-i18next";
import { selectVisibleArtists } from "../../features/visibleSelectors";
import { useEffect, useRef, useState } from "react";
import { getScrollbarWidth } from "../../app/utils";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import ArtistGridItem from "./subviews/ArtistGridItem";
import { useScrollDetection } from "../../hooks/useScrollDetection";

type ArtistGridItemProps = GridChildComponentProps & {
  index: number;
};

export default function ArtistGrid() {
  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const visibleArtists = useAppSelector(selectVisibleArtists);
  const [overscanRowCount, setOverscanRowCount] = useState(0);
  const { onScroll } = useScrollDetection();

  useEffect(() => {
    setOverscanRowCount(20);
  }, []);

  const itemRenderer = ({ index, style }: ArtistGridItemProps) => {
    const artist = visibleArtists[index];
    if (!artist) return null;
    return (
      <div key={artist.artistId} style={style}>
        <div className={`artist-grid-item ${styles.gridItem}`}>
          <ArtistGridItem artist={artist} />
        </div>
      </div>
    );
  };

  return (
    <div className={`artist-grid ${styles.grid}`}>
      {visibleArtists.length > 0 ? (
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
            const rowCount = Math.ceil(visibleArtists.length / columnCount);

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
        <div className={styles.empty}>{t("artistGrid.empty")}</div>
      )}
    </div>
  );
}
