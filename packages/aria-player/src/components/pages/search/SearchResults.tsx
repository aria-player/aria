import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect, useRef, useState } from "react";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectSearch } from "../../../features/search/searchSlice";
import { selectVisibleSearchResults } from "../../../features/visibleSelectors";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { AlbumGridItem } from "../../views/subviews/AlbumGridItem";
import { TrackSummaryRow } from "../../views/subviews/TrackSummaryRow";
import styles from "./SearchResults.module.css";
import { useTranslation } from "react-i18next";
import ArtistGridItem from "../../views/subviews/ArtistGridItem";
import { getScrollbarWidth } from "../../../app/utils";
import {
  ArtistDetails,
  AlbumDetails,
  TrackListItem
} from "../../../features/tracks/tracksTypes";
import TopResultItem from "./TopResultItem";

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const searchResults = useAppSelector(selectVisibleSearchResults);
  const { gridRef, gridProps } = useTrackGrid();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const topResults = useMemo(() => {
    if (!search.trim() || !searchResults) return [];

    const allResults = [
      ...searchResults.tracks,
      ...searchResults.artists,
      ...searchResults.albums
    ];

    return allResults.sort((a, b) => a.score - b.score);
  }, [search, searchResults]);

  const songResults = (searchResults?.tracks.map((result) => result.item) ||
    []) as TrackListItem[];
  const artistResults = (searchResults?.artists.map((result) => result.item) ||
    []) as ArtistDetails[];
  const albumResults = (searchResults?.albums.map((result) => result.item) ||
    []) as AlbumDetails[];

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
        {topResults.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                {t("search.categories.topResults")}
              </h2>
            </div>
            <div className={styles.topResultsGrid}>
              {topResults.slice(0, 6).map((result, index) => (
                <TopResultItem
                  key={`${result.type}-${index}`}
                  result={result}
                />
              ))}
            </div>
          </section>
        )}
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
