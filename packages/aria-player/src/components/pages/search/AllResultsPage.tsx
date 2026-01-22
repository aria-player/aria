import { AgGridReact } from "@ag-grid-community/react";
import { useMemo, useEffect, useRef, useState } from "react";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectSearch,
  selectDebouncedSearch
} from "../../../features/search/searchSlice";
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
import {
  selectCachedSearchTracks,
  selectCachedSearchAlbums,
  selectCachedSearchArtists,
  updateCachedSearchAlbums,
  updateCachedSearchArtists
} from "../../../features/cache/cacheSlice";
import { store } from "../../../app/store";
import {
  addTracks,
  selectTrackById
} from "../../../features/tracks/tracksSlice";
import {
  addAlbums,
  selectAlbumsInfo
} from "../../../features/albums/albumsSlice";
import {
  addArtists,
  selectArtistsInfo
} from "../../../features/artists/artistsSlice";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { updateCachedSearchTracks } from "../../../features/cache/cacheSlice";
import { getTrackId, getAlbumId, getArtistId } from "../../../app/utils";
import LoadingSpinner from "../../views/subviews/LoadingSpinner";

export default function AllResultsPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const debouncedSearch = useAppSelector(selectDebouncedSearch);
  const searchResults = useAppSelector(selectVisibleSearchResults);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const { gridRef, gridProps } = useTrackGrid();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { onScroll } = useScrollDetection();
  const externalSearchHandle =
    visibleSearchSource !== null ? getSourceHandle(visibleSearchSource) : null;
  const isExternalSearchSource =
    !!externalSearchHandle?.searchTracks && !!debouncedSearch.trim();
  const isDebouncingExternalSearch =
    !!externalSearchHandle?.searchTracks &&
    !!search.trim() &&
    debouncedSearch !== search;
  const externalSearchCacheKey = useMemo(() => {
    if (!isExternalSearchSource || !visibleSearchSource) return null;
    return getExternalSearchCacheKey(visibleSearchSource, debouncedSearch);
  }, [isExternalSearchSource, debouncedSearch, visibleSearchSource]);
  const cachedSearchTrackIds = useAppSelector((state) =>
    externalSearchCacheKey
      ? selectCachedSearchTracks(state, externalSearchCacheKey)
      : undefined
  );
  const cachedSearchAlbumIds = useAppSelector((state) =>
    externalSearchCacheKey
      ? selectCachedSearchAlbums(state, externalSearchCacheKey)
      : undefined
  );
  const cachedSearchArtistIds = useAppSelector((state) =>
    externalSearchCacheKey
      ? selectCachedSearchArtists(state, externalSearchCacheKey)
      : undefined
  );
  const albumsInfo = useAppSelector(selectAlbumsInfo);
  const artistsInfo = useAppSelector(selectArtistsInfo);
  const [isLoading, setIsLoading] = useState(
    isExternalSearchSource &&
      !!externalSearchHandle?.searchTracks &&
      !cachedSearchTrackIds
  );
  const fetchedTracksRef = useRef<string | null>(null);
  const fetchedAlbumsRef = useRef<string | null>(null);
  const fetchedArtistsRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      externalSearchCacheKey &&
      fetchedTracksRef.current !== externalSearchCacheKey
    ) {
      fetchedTracksRef.current = null;
      fetchedAlbumsRef.current = null;
      fetchedArtistsRef.current = null;
    }
  }, [externalSearchCacheKey]);

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
      debouncedSearch.trim().length > 0 &&
      externalSearchCacheKey;

    if (
      !shouldFetch ||
      !visibleSearchSource ||
      fetchedTracksRef.current === externalSearchCacheKey
    )
      return;

    const fetchExternalTracks = async () => {
      fetchedTracksRef.current = externalSearchCacheKey;
      if (!cachedSearchTrackIds) {
        setIsLoading(true);
      }
      try {
        const tracks = await externalSearchHandle?.searchTracks?.(
          debouncedSearch,
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
    cachedSearchTrackIds,
    dispatch,
    externalSearchCacheKey,
    externalSearchHandle,
    isExternalSearchSource,
    debouncedSearch,
    visibleSearchSource
  ]);

  useEffect(() => {
    const shouldFetch =
      isExternalSearchSource &&
      externalSearchHandle?.searchAlbums &&
      debouncedSearch.trim().length > 0 &&
      externalSearchCacheKey;

    if (
      !shouldFetch ||
      !visibleSearchSource ||
      fetchedAlbumsRef.current === externalSearchCacheKey
    )
      return;

    const fetchExternalAlbums = async () => {
      fetchedAlbumsRef.current = externalSearchCacheKey;
      try {
        const albumsMetadata = await externalSearchHandle?.searchAlbums?.(
          debouncedSearch,
          0,
          20
        );
        if (!albumsMetadata?.length) return;

        const albums = albumsMetadata.map((album) => ({
          ...album,
          albumId: getAlbumId(
            visibleSearchSource,
            album.name ?? "",
            album.artist,
            album.uri
          ),
          source: visibleSearchSource
        }));

        dispatch(addAlbums({ source: visibleSearchSource, albums }));

        const albumIds = albums.map((album) => album.albumId);

        dispatch(
          updateCachedSearchAlbums({
            key: externalSearchCacheKey,
            albumIds,
            offset: 0
          })
        );
      } catch (error) {
        console.error("Failed to fetch external albums:", error);
      }
    };

    fetchExternalAlbums();
  }, [
    cachedSearchAlbumIds,
    dispatch,
    externalSearchCacheKey,
    externalSearchHandle,
    isExternalSearchSource,
    debouncedSearch,
    visibleSearchSource
  ]);

  useEffect(() => {
    const shouldFetch =
      isExternalSearchSource &&
      externalSearchHandle?.searchArtists &&
      debouncedSearch.trim().length > 0 &&
      externalSearchCacheKey;

    if (
      !shouldFetch ||
      !visibleSearchSource ||
      fetchedArtistsRef.current === externalSearchCacheKey
    )
      return;

    const fetchExternalArtists = async () => {
      fetchedArtistsRef.current = externalSearchCacheKey;
      try {
        const artistsMetadata = await externalSearchHandle?.searchArtists?.(
          debouncedSearch,
          0,
          20
        );
        if (!artistsMetadata?.length) return;

        const artists = artistsMetadata.map((artist) => ({
          ...artist,
          artistId: getArtistId(visibleSearchSource, artist.name, artist.uri),
          source: visibleSearchSource
        }));

        dispatch(addArtists({ source: visibleSearchSource, artists }));

        const artistIds = artists.map((artist) => artist.artistId);

        dispatch(
          updateCachedSearchArtists({
            key: externalSearchCacheKey,
            artistIds,
            offset: 0
          })
        );
      } catch (error) {
        console.error("Failed to fetch external artists:", error);
      }
    };

    fetchExternalArtists();
  }, [
    cachedSearchArtistIds,
    dispatch,
    externalSearchCacheKey,
    externalSearchHandle,
    isExternalSearchSource,
    debouncedSearch,
    visibleSearchSource
  ]);

  const cachedAlbumResults = useMemo(() => {
    if (!isExternalSearchSource || !cachedSearchAlbumIds?.length) return [];
    return cachedSearchAlbumIds
      .map((albumId) => albumsInfo[albumId])
      .filter(Boolean);
  }, [cachedSearchAlbumIds, isExternalSearchSource, albumsInfo]);

  const cachedArtistResults = useMemo(() => {
    if (!isExternalSearchSource || !cachedSearchArtistIds?.length) return [];
    return cachedSearchArtistIds
      .map((artistId) => artistsInfo[artistId])
      .filter(Boolean);
  }, [cachedSearchArtistIds, isExternalSearchSource, artistsInfo]);

  const songResults = useMemo(() => {
    if (isExternalSearchSource || isDebouncingExternalSearch) {
      return (
        isExternalSearchSource ? cachedSongResults : []
      ) as TrackListItem[];
    }
    return (searchResults?.tracks.map((result) => result.item) ||
      []) as TrackListItem[];
  }, [
    isExternalSearchSource,
    isDebouncingExternalSearch,
    cachedSongResults,
    searchResults?.tracks
  ]);

  const artistResults = useMemo(() => {
    if (isExternalSearchSource || isDebouncingExternalSearch) {
      return (
        isExternalSearchSource ? cachedArtistResults : []
      ) as ArtistDetails[];
    }
    return (searchResults?.artists.map((result) => result.item) ||
      []) as ArtistDetails[];
  }, [
    isExternalSearchSource,
    isDebouncingExternalSearch,
    cachedArtistResults,
    searchResults?.artists
  ]);

  const albumResults = useMemo(() => {
    if (isExternalSearchSource || isDebouncingExternalSearch) {
      return (
        isExternalSearchSource ? cachedAlbumResults : []
      ) as AlbumDetails[];
    }
    return (searchResults?.albums.map((result) => result.item) ||
      []) as AlbumDetails[];
  }, [
    isExternalSearchSource,
    isDebouncingExternalSearch,
    cachedAlbumResults,
    searchResults?.albums
  ]);

  const topResults = useMemo(() => {
    if (!search.trim()) return [];

    if (isExternalSearchSource) {
      // For now, rather than scoring external results across categories, just show a few from each
      const songs = songResults
        .slice(0, 2)
        .map((item) => ({ type: "track" as const, item, score: 0 }));
      const artists = artistResults
        .slice(0, 2)
        .map((item) => ({ type: "artist" as const, item, score: 0 }));
      const albums = albumResults
        .slice(0, 2)
        .map((item) => ({ type: "album" as const, item, score: 0 }));
      const moreSongs = songResults
        .slice(2, 6)
        .map((item) => ({ type: "track" as const, item, score: 0 }));
      return [...songs, ...artists, ...albums, ...moreSongs].slice(0, 6);
    }

    if (!searchResults) return [];

    const allResults = [
      ...searchResults.tracks,
      ...searchResults.artists,
      ...searchResults.albums
    ];

    return allResults.sort((a, b) => a.score - b.score);
  }, [
    search,
    searchResults,
    isExternalSearchSource,
    artistResults,
    albumResults,
    songResults
  ]);

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

  const showLoadingSpinner = isLoading || isDebouncingExternalSearch;

  return (
    <div
      className={styles.searchResults}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      {showLoadingSpinner && <LoadingSpinner />}
      {!showLoadingSpinner &&
        songResults.length === 0 &&
        artistResults.length === 0 &&
        albumResults.length === 0 && (
          <div className={styles.noResults}>{t("search.noResults")}</div>
        )}
      {!showLoadingSpinner && (
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
