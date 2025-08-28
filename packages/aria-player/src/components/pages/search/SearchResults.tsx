import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect, useRef, useState } from "react";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectSearch } from "../../../features/search/searchSlice";
import {
  selectAllArtists,
  selectAllAlbums
} from "../../../features/tracks/tracksSlice";
import { selectVisibleTracks } from "../../../features/visibleSelectors";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { AlbumGridItem } from "../../views/subviews/AlbumGridItem";
import { TrackSummaryRow } from "../../views/subviews/TrackSummaryRow";
import styles from "./SearchResults.module.css";
import { useTranslation } from "react-i18next";
import ArtistGridItem from "../../views/subviews/ArtistGridItem";
import { getScrollbarWidth } from "../../../app/utils";

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const songResults = useAppSelector(selectVisibleTracks);
  const allArtists = useAppSelector(selectAllArtists);
  const allAlbums = useAppSelector(selectAllAlbums);
  const { gridRef, gridProps } = useTrackGrid();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const artistResults = useMemo(() => {
    if (!search) return [];
    return allArtists
      .filter((artist) =>
        artist.artist.toLowerCase().includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          a.artist?.localeCompare(b.artist!, undefined, {
            sensitivity: "base",
            ignorePunctuation: true
          }) ?? 0
      );
  }, [allArtists, search]);

  const albumResults = useMemo(() => {
    if (!search) return [];
    return allAlbums
      .filter((album) =>
        album.album.toLowerCase().includes(search.toLowerCase())
      )
      .sort(
        (a, b) =>
          a.album?.localeCompare(b.album!, undefined, {
            sensitivity: "base",
            ignorePunctuation: true
          }) ?? 0
      );
  }, [allAlbums, search]);

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
    dispatch(
      push(BASEPATH + "search/" + encodeURIComponent(search) + "/songs")
    );
  };

  const viewAllArtists = () => {
    dispatch(
      push(BASEPATH + "search/" + encodeURIComponent(search) + "/artists")
    );
  };

  const viewAllAlbums = () => {
    dispatch(
      push(BASEPATH + "search/" + encodeURIComponent(search) + "/albums")
    );
  };

  return (
    <div className={styles.searchResults}>
      {songResults.length === 0 && (
        <div className={styles.noResults}>{t("search.noResults")}</div>
      )}
      <div ref={containerRef}>
        {songResults.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("search.categories.songs")}
              </h2>
              <button
                className={styles.viewAll}
                onClick={viewAllSongs}
                title={t("search.viewAllTooltips.songs")}
              >
                {t("search.viewAll")}
              </button>
            </div>
            <div
              style={{ height: 48 * Math.min(5, songResults.length) + 8 }}
              className="ag-theme-balham ag-overrides-track-summary-rows"
            >
              <AgGridReact
                {...gridProps}
                ref={gridRef}
                rowData={songResults.slice(0, 5)}
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
        {artistResults.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("search.categories.artists")}
              </h2>
              <button
                className={styles.viewAll}
                onClick={viewAllArtists}
                title={t("search.viewAllTooltips.artists")}
              >
                {t("search.viewAll")}
              </button>
            </div>
            <div
              className={styles.gridRow}
              style={{
                gridTemplateColumns: `repeat(${gridLayout.columnCount}, 1fr)`,
                height: gridLayout.columnWidth + 40
              }}
            >
              {artistResults.slice(0, gridLayout.columnCount).map((artist) => (
                <div
                  key={artist.artist}
                  className={styles.gridItem}
                  style={{ width: gridLayout.columnWidth }}
                >
                  <ArtistGridItem artist={artist} />
                </div>
              ))}
            </div>
          </section>
        )}
        {albumResults.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("search.categories.albums")}
              </h2>
              <button
                className={styles.viewAll}
                onClick={viewAllAlbums}
                title={t("search.viewAllTooltips.albums")}
              >
                {t("search.viewAll")}
              </button>
            </div>
            <div
              className={styles.gridRow}
              style={{
                gridTemplateColumns: `repeat(${gridLayout.columnCount}, 1fr)`,
                height: gridLayout.columnWidth + 40
              }}
            >
              {albumResults.slice(0, gridLayout.columnCount).map((album) => (
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
