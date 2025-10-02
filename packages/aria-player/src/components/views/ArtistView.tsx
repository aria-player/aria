import { useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { push } from "redux-first-history";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { BASEPATH } from "../../app/constants";
import { getScrollbarWidth } from "../../app/utils";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { selectAllArtists } from "../../features/tracks/tracksSlice";
import { TrackSummaryRow } from "./subviews/TrackSummaryRow";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import { AlbumArt } from "./subviews/AlbumArt";
import styles from "./ArtistView.module.css";
import {
  selectVisibleSelectedTrackGroup,
  selectVisibleArtistTracks,
  selectVisibleArtistAlbums
} from "../../features/visibleSelectors";
import { useScrollDetection } from "../../hooks/useScrollDetection";

export default function ArtistView() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { gridRef, gridProps } = useTrackGrid();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const artistName = useAppSelector(selectVisibleSelectedTrackGroup);
  const artistTracks = useAppSelector(selectVisibleArtistTracks);
  const artistAlbums = useAppSelector(selectVisibleArtistAlbums);
  const visibleArtist = useAppSelector(selectAllArtists).find(
    (a) => a.artist === artistName
  );
  const { onScroll } = useScrollDetection();

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
      setContainerWidth(containerRef.current.offsetWidth);
    }

    return () => resizeObserver.disconnect();
  }, []);

  const gridLayout = useMemo(() => {
    if (!containerWidth) return { columnCount: 0, columnWidth: 0 };

    const availableWidth = containerWidth - (getScrollbarWidth() ?? 0);
    const minItemWidth = 200;
    const columnCount = Math.max(1, Math.floor(availableWidth / minItemWidth));
    const columnWidth = availableWidth / columnCount;

    return { columnCount, columnWidth };
  }, [containerWidth]);

  const viewAllSongs = () => {
    if (!artistName) return;
    dispatch(
      push(BASEPATH + "artist/" + encodeURIComponent(artistName) + "/songs")
    );
  };

  const viewAllAlbums = () => {
    if (!artistName) return;
    dispatch(
      push(BASEPATH + "artist/" + encodeURIComponent(artistName) + "/albums")
    );
  };

  if (!artistName || !visibleArtist) {
    return <div className={styles.notFound}>{t("artist.notFound")}</div>;
  }

  return (
    <div
      className={styles.artistView}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      <section className={styles.artistHeader}>
        <div className={styles.artistArt}>
          <AlbumArt track={visibleArtist.firstTrack} altText={artistName} />
        </div>
        <div className={styles.artistInfo}>
          <h1 className={styles.artistName}>{artistName}</h1>
        </div>
      </section>
      <div ref={containerRef}>
        {artistTracks.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("artist.sections.songs.title")}
              </h2>
              <button
                className={styles.viewAll}
                onClick={viewAllSongs}
                title={t("artist.sections.songs.viewAll")}
              >
                {t("artist.viewAll")}
              </button>
            </div>
            <div
              style={{ height: 48 * Math.min(5, artistTracks.length) + 8 }}
              className="ag-theme-balham ag-overrides-track-summary-rows"
            >
              <AgGridReact
                {...gridProps}
                ref={gridRef}
                rowData={artistTracks.slice(0, 5)}
                columnDefs={[]}
                alwaysShowVerticalScroll={false}
                fullWidthCellRenderer={TrackSummaryRow}
                isFullWidthRow={() => true}
                headerHeight={0}
                rowHeight={48}
              />
            </div>
          </section>
        )}
        {artistAlbums.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("artist.sections.albums.title")}
              </h2>
              <button
                className={styles.viewAll}
                onClick={viewAllAlbums}
                title={t("artist.sections.albums.viewAll")}
              >
                {t("artist.viewAll")}
              </button>
            </div>
            <div
              className={styles.gridRow}
              style={{
                gridTemplateColumns: `repeat(${gridLayout.columnCount}, 1fr)`,
                height: gridLayout.columnWidth + 80
              }}
            >
              {artistAlbums.slice(0, gridLayout.columnCount).map((album) => (
                <div
                  key={album.albumId}
                  className={styles.gridItem}
                  style={{ width: gridLayout.columnWidth }}
                >
                  <AlbumGridItem album={album} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
