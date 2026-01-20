import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect, useRef, useState } from "react";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectSearch } from "../../../features/search/searchSlice";
import {
  selectVisibleSearchResults,
  selectVisibleSearchSource
} from "../../../features/visibleSelectors";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { AlbumGridItem } from "../../views/subviews/AlbumGridItem";
import { TrackSummaryRow } from "../../views/subviews/TrackSummaryRow";
import styles from "./AllResultsPage.module.css";
import { useTranslation } from "react-i18next";
import ArtistGridItem from "../../views/subviews/ArtistGridItem";
import {
  getExternalSearchCacheKey,
  getScrollbarWidth
} from "../../../app/utils";
import { TrackListItem } from "../../../features/tracks/tracksTypes";
import TopResultItem from "./TopResultItem";
import { useScrollDetection } from "../../../hooks/useScrollDetection";
import { ArtistDetails } from "../../../features/artists/artistsTypes";
import { AlbumDetails } from "../../../features/albums/albumsTypes";
import { selectCachedSearchTracks } from "../../../features/cache/cacheSlice";
import { store } from "../../../app/store";
import {
  addTracks,
  selectTrackById
} from "../../../features/tracks/tracksSlice";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { updateCachedSearchTracks } from "../../../features/cache/cacheSlice";
import { getTrackId } from "../../../app/utils";
import LoadingSpinner from "../../views/subviews/LoadingSpinner";

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const searchResults = useAppSelector(selectVisibleSearchResults);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const { gridRef, gridProps } = useTrackGrid();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { onScroll } = useScrollDetection();
  const externalSearchHandle =
    visibleSearchSource !== null ? getSourceHandle(visibleSearchSource) : null;
  const isExternalSearchSource =
    !!externalSearchHandle?.searchTracks && !!search.trim();
  const externalSearchCacheKey = useMemo(() => {
    if (!isExternalSearchSource || !visibleSearchSource) return null;
    return getExternalSearchCacheKey(visibleSearchSource, search);
  }, [isExternalSearchSource, search, visibleSearchSource]);
  const cachedSearchTrackIds = useAppSelector((state) =>
    externalSearchCacheKey
      ? selectCachedSearchTracks(state, externalSearchCacheKey)
      : undefined
  );
  const [isLoading, setIsLoading] = useState(
    isExternalSearchSource &&
      !!externalSearchHandle?.searchTracks &&
      !cachedSearchTrackIds
  );
  const cachedSongResults = useMemo(() => {
    if (!isExternalSearchSource || !cachedSearchTrackIds?.length) return [];
    const state = store.getState();
    return cachedSearchTrackIds
      .map((trackId) => {
        const track = selectTrackById(state, trackId);
        if (!track) return null;
        return {
          ...track,
          itemId: trackId
        } as TrackListItem;
      })
      .filter(Boolean) as TrackListItem[];
  }, [cachedSearchTrackIds, isExternalSearchSource]);

  useEffect(() => {
    const shouldFetch =
      isExternalSearchSource &&
      externalSearchHandle?.searchTracks &&
      search.trim().length > 0 &&
      externalSearchCacheKey;

    if (!shouldFetch || !visibleSearchSource) return;

    const fetchExternalTracks = async () => {
      if ((cachedSearchTrackIds?.length ?? 0) === 0) {
        setIsLoading(true);
      }
      try {
        const tracks = await externalSearchHandle?.searchTracks?.(
          search,
          0,
          20
        );
        if (!tracks?.length) return;

        dispatch(
          addTracks({
            source: visibleSearchSource,
            tracks,
            addToLibrary: false
          })
        );

        const trackIds = tracks.map((track) =>
          getTrackId(visibleSearchSource, track.uri)
        );

        dispatch(
          updateCachedSearchTracks({
            key: externalSearchCacheKey,
            trackIds,
            offset: 0
          })
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchExternalTracks();
  }, [
    cachedSearchTrackIds?.length,
    dispatch,
    externalSearchCacheKey,
    externalSearchHandle,
    externalSearchHandle?.searchTracks,
    isExternalSearchSource,
    search,
    visibleSearchSource
  ]);

  const topResults = useMemo(() => {
    if (!search.trim() || !searchResults) return [];

    const allResults = [
      ...searchResults.tracks,
      ...searchResults.artists,
      ...searchResults.albums
    ];

    return allResults.sort((a, b) => a.score - b.score);
  }, [search, searchResults]);

  const songResults = (
    isExternalSearchSource
      ? cachedSongResults
      : searchResults?.tracks.map((result) => result.item) || []
  ) as TrackListItem[];
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

  const buildSearchRoute = (category?: string) => {
    const basePath =
      "search/" +
      encodeURIComponent(search) +
      "/" +
      encodeURIComponent(visibleSearchSource || "library");
    return BASEPATH + basePath + (category ? `/${category}` : "");
  };

  const viewAllSongs = () => dispatch(push(buildSearchRoute("songs")));
  const viewAllArtists = () => dispatch(push(buildSearchRoute("artists")));
  const viewAllAlbums = () => dispatch(push(buildSearchRoute("albums")));

  return (
    <div
      className={styles.searchResults}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      {isLoading && <LoadingSpinner />}
      {!isLoading && songResults.length === 0 && (
        <div className={styles.noResults}>{t("search.noResults")}</div>
      )}
      {!isLoading && (
        <div ref={containerRef}>
          {topResults.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>
                  {t("search.topResults")}
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
                  {t("search.categories.songs.other")}
                </h2>
                <button
                  className={styles.viewAll}
                  onClick={viewAllSongs}
                  title={t("search.categories.songs.viewAll")}
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
                  {t("search.categories.artists.other")}
                </h2>
                <button
                  className={styles.viewAll}
                  onClick={viewAllArtists}
                  title={t("search.categories.artists.viewAll")}
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
                {artistResults
                  .slice(0, gridLayout.columnCount)
                  .map((artist) => (
                    <div
                      key={artist.artistId}
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
                  {t("search.categories.albums.other")}
                </h2>
                <button
                  className={styles.viewAll}
                  onClick={viewAllAlbums}
                  title={t("search.categories.albums.viewAll")}
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
      )}
    </div>
  );
}
