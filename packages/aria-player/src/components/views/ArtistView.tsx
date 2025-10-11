import { useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { push } from "redux-first-history";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { BASEPATH } from "../../app/constants";
import { getScrollbarWidth } from "../../app/utils";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { TrackSummaryRow } from "./subviews/TrackSummaryRow";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import styles from "./ArtistView.module.css";
import {
  selectVisibleSelectedTrackGroup,
  selectVisibleArtistTracks,
  selectVisibleArtistAlbums,
  selectVisibleArtist
} from "../../features/visibleSelectors";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { ArtistArt } from "./subviews/ArtistArt";

export default function ArtistView() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { gridRef, gridProps } = useTrackGrid();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const artistId = useAppSelector(selectVisibleSelectedTrackGroup);
  const artistTracks = useAppSelector(selectVisibleArtistTracks);
  const artistAlbums = useAppSelector(selectVisibleArtistAlbums);
  const visibleArtist = useAppSelector(selectVisibleArtist);
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
    if (!artistId) return;
    dispatch(
      push(BASEPATH + "artist/" + encodeURIComponent(artistId) + "/songs")
    );
  };

  const viewAllAlbums = () => {
    if (!artistId) return;
    dispatch(
      push(BASEPATH + "artist/" + encodeURIComponent(artistId) + "/albums")
    );
  };

  if (!artistId || !visibleArtist) {
    return <div className={styles.notFound}>{t("artist.notFound")}</div>;
  }

  return (
    <div
      className={styles.artistView}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      <section className={styles.artistHeader}>
        <div className={styles.artistArt}>
          <ArtistArt
            track={visibleArtist.firstTrack}
            altText={visibleArtist.name}
            artistId={visibleArtist.artistId}
          />
        </div>
        <div className={styles.artistInfo}>
          <h1 className={styles.artistName}>{visibleArtist.name}</h1>
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
