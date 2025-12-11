import { useMemo, useRef, useState, useEffect } from "react";
import { AgGridReact } from "@ag-grid-community/react";
import { push } from "redux-first-history";
import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { BASEPATH } from "../../app/constants";
import {
  getAlbumId,
  getScrollbarWidth,
  getTrackId,
  parseArtistId
} from "../../app/utils";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { TrackSummaryRow } from "./subviews/TrackSummaryRow";
import { AlbumGridItem } from "./subviews/AlbumGridItem";
import styles from "./ArtistView.module.css";
import {
  selectVisibleSelectedTrackGroup,
  selectVisibleArtist,
  selectVisibleArtistTracks,
  selectVisibleArtistAlbums
} from "../../features/visibleSelectors";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { ArtistArt } from "./subviews/ArtistArt";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { addTracks, selectTrackById } from "../../features/tracks/tracksSlice";
import LoadingSpinner from "./subviews/LoadingSpinner";
import { addAlbums, selectAlbumsInfo } from "../../features/albums/albumsSlice";
import { store } from "../../app/store";
import {
  selectCachedArtistAlbums,
  selectCachedArtistTopTracks,
  updateCachedArtistAlbums,
  updateCachedArtistTopTracks
} from "../../features/cache/cacheSlice";

const OVERSCROLL_BUFFER = 5;

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
  const artistTopTracks = useAppSelector((state) =>
    selectCachedArtistTopTracks(state, artistId || "")
  );
  const orderedTracks = useMemo(() => artistTopTracks || [], [artistTopTracks]);
  const albumsInfo = useAppSelector(selectAlbumsInfo);
  const cachedAlbums = useAppSelector((state) =>
    selectCachedArtistAlbums(state, artistId || "")
  );

  const parsedArtist = useMemo(() => {
    if (!artistId) return null;
    return parseArtistId(artistId);
  }, [artistId]);

  const pluginHandle = visibleArtist
    ? getSourceHandle(visibleArtist.source)
    : null;

  const isExternalArtistView =
    parsedArtist != undefined &&
    parsedArtist.uri != undefined &&
    pluginHandle?.getArtistAlbums != undefined;

  const [isLoading, setIsLoading] = useState(
    isExternalArtistView && artistTopTracks === undefined
  );

  const displayAlbums = useMemo(() => {
    if (isExternalArtistView && cachedAlbums && cachedAlbums.length > 0) {
      return cachedAlbums.map((albumId) => albumsInfo[albumId]).filter(Boolean);
    }
    return artistAlbums;
  }, [albumsInfo, cachedAlbums, isExternalArtistView, artistAlbums]);

  const orderedAlbums = useMemo(
    () => displayAlbums.map((album) => album.albumId),
    [displayAlbums]
  );

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

  useEffect(() => {
    async function fetchTracks() {
      if (!artistId) return;
      const artistInfo = parseArtistId(artistId);
      const handle = artistInfo && getSourceHandle(artistInfo.source);
      if (!handle || !artistInfo?.uri) return;
      const { source, uri } = artistInfo;
      if (orderedTracks.length == 0 || orderedAlbums.length == 0) {
        setIsLoading(true);
      }
      try {
        const tracks = await handle.getArtistTopTracks?.(uri, 0, 20);
        if (tracks?.length) {
          dispatch(
            addTracks({
              source,
              tracks,
              addToLibrary: false
            })
          );
          const trackIds = tracks.map((t) => getTrackId(source, t.uri));
          dispatch(
            updateCachedArtistTopTracks({
              artistId,
              trackIds,
              offset: 0
            })
          );
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchTracks();
  }, [dispatch, artistId, orderedTracks.length, orderedAlbums.length]);

  useEffect(() => {
    async function fetchAlbums() {
      const requiredAlbumCount = gridLayout.columnCount + OVERSCROLL_BUFFER;
      if (!artistId || requiredAlbumCount <= OVERSCROLL_BUFFER) return;
      if (!isExternalArtistView) return;
      if (orderedAlbums.length >= requiredAlbumCount) return;

      const artistInfo = parseArtistId(artistId);
      const handle = artistInfo && getSourceHandle(artistInfo.source);
      if (!handle || !artistInfo?.uri) return;
      const { source, uri } = artistInfo;

      const albums = await handle.getArtistAlbums?.(
        uri,
        orderedAlbums.length,
        requiredAlbumCount
      );
      if (albums?.length) {
        const albumsWithIds = albums.map((album) => ({
          ...album,
          albumId: getAlbumId(source, album.name, album.artist, album.uri),
          source
        }));
        dispatch(addAlbums({ source, albums: albumsWithIds }));
        const newAlbumIds = albumsWithIds.map((a) => a.albumId);
        dispatch(
          updateCachedArtistAlbums({
            artistId,
            albumIds: newAlbumIds,
            offset: orderedAlbums.length
          })
        );
      }
    }
    fetchAlbums();
  }, [
    dispatch,
    artistId,
    orderedAlbums.length,
    gridLayout.columnCount,
    isExternalArtistView
  ]);

  const rowData = useMemo(() => {
    if (!orderedTracks.length) return artistTracks.slice(0, 5);
    const state = store.getState();
    return orderedTracks
      .map((trackId) => ({
        ...selectTrackById(state, trackId),
        itemId: trackId
      }))
      .slice(0, 5);
  }, [artistTracks, orderedTracks]);

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

  if (!artistId) {
    return <div className={styles.notFound}>{t("artist.notFound")}</div>;
  }

  return (
    <div
      className={styles.artistView}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      {!isLoading && visibleArtist && (
        <section className={styles.artistHeader}>
          <div className={styles.artistArt}>
            <ArtistArt artist={visibleArtist} />
          </div>
          <div className={styles.artistInfo}>
            <h1 className={styles.artistName}>{visibleArtist.name}</h1>
            {visibleArtist.uri && pluginHandle?.Attribution ? (
              <pluginHandle.Attribution
                type="artist"
                id={visibleArtist.uri}
                compact={false}
              />
            ) : pluginHandle?.displayName ? (
              <span className={styles.artistSource}>
                {pluginHandle?.displayName}
              </span>
            ) : null}
          </div>
        </section>
      )}
      {isLoading && <LoadingSpinner />}
      <div ref={containerRef}>
        {!isLoading && (
          <>
            {rowData.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>
                    {t(
                      orderedTracks.length
                        ? "artist.sections.topSongs.title"
                        : "artist.sections.songs.title"
                    )}
                  </h2>
                  <button
                    className={styles.viewAll}
                    onClick={viewAllSongs}
                    title={t(
                      orderedTracks.length
                        ? "artist.sections.topSongs.viewAll"
                        : "artist.sections.songs.viewAll"
                    )}
                  >
                    {t("artist.viewAll")}
                  </button>
                </div>
                <div
                  style={{ height: 48 * Math.min(5, rowData.length) + 8 }}
                  className="ag-theme-balham ag-overrides-track-summary-rows"
                >
                  <AgGridReact
                    {...gridProps}
                    ref={gridRef}
                    rowData={rowData}
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
            {displayAlbums.length > 0 && (
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
                  {displayAlbums
                    .slice(0, gridLayout.columnCount)
                    .map((album) => (
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
          </>
        )}
      </div>
    </div>
  );
}
