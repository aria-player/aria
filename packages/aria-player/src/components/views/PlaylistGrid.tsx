import { useRef } from "react";
import { useAppSelector } from "../../app/hooks";
import { useTranslation } from "react-i18next";
import { selectVisiblePlaylists } from "../../features/visibleSelectors";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { getScrollbarWidth } from "../../app/utils";
import { AutoSizer } from "react-virtualized-auto-sizer";
import { CellComponentProps, Grid, GridImperativeAPI } from "react-window";
import PlaylistGridItem from "./subviews/PlaylistGridItem";
import styles from "./PlaylistGrid.module.css";

const OVERSCAN_ROW_COUNT = 20;

type PlaylistGridItemProps = CellComponentProps<{
  columnCount: number;
  playlists: ReturnType<typeof selectVisiblePlaylists>;
}>;

export default function PlaylistGrid() {
  const { t } = useTranslation();
  const { onScroll } = useScrollDetection();
  const gridRef = useRef<GridImperativeAPI | null>(null);
  const visiblePlaylists = useAppSelector(selectVisiblePlaylists);

  const itemRenderer = ({
    columnIndex,
    rowIndex,
    style,
    columnCount,
    playlists,
  }: PlaylistGridItemProps) => {
    const index = rowIndex * columnCount + columnIndex;
    const playlist = playlists[index];
    if (!playlist) {
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
      {visiblePlaylists.length > 0 ? (
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
            const rowCount = Math.ceil(visiblePlaylists.length / columnCount);

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
                  cellComponent={itemRenderer}
                  cellProps={{
                    columnCount,
                    playlists: visiblePlaylists,
                  }}
                />
              </div>
            );
          }}
        />
      ) : (
        <div className={styles.empty}>{t("search.noResults")}</div>
      )}
    </div>
  );
}
