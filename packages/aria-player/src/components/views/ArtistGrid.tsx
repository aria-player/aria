import { useAppSelector } from "../../app/hooks";
import { selectAllArtists } from "../../features/tracks/tracksSlice";
import styles from "./ArtistGrid.module.css";
import { useTranslation } from "react-i18next";
import { selectVisibleTrackGroups } from "../../features/visibleSelectors";
import { useEffect, useMemo, useRef, useState } from "react";
import { getScrollbarWidth } from "../../app/utils";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import ArtistGridItem from "./subviews/ArtistGridItem";

type ArtistGridItemProps = GridChildComponentProps & {
  index: number;
};

export default function ArtistGrid() {
  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const allArtists = useAppSelector(selectAllArtists);
  const visibleTrackGroups = useAppSelector(selectVisibleTrackGroups);
  const [overscanRowCount, setOverscanRowCount] = useState(0);

  const visibleArtists = useMemo(() => {
    return allArtists
      .filter((artist) => visibleTrackGroups.includes(artist.artist))
      .sort(
        (a, b) =>
          a.artist?.localeCompare(b.artist!, undefined, {
            sensitivity: "base",
            ignorePunctuation: true
          }) ?? 0
      );
  }, [allArtists, visibleTrackGroups]);

  useEffect(() => {
    setOverscanRowCount(20);
  }, []);

  const itemRenderer = ({ index, style }: ArtistGridItemProps) => {
    const artist = visibleArtists[index];
    if (!artist) return null;
    return (
      <div key={artist.artist} style={style}>
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
