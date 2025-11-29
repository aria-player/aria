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
import { addAlbums } from "../../features/albums/albumsSlice";
import { TrackId } from "../../../../types";
import { store } from "../../app/store";

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
  const [isLoading, setIsLoading] = useState(false);
  const [orderedTracks, setOrderedTracks] = useState<TrackId[]>([]);
  const [fetchedAlbumCount, setFetchedAlbumCount] = useState(0);

  const pluginHandle = visibleArtist
    ? getSourceHandle(visibleArtist.source)
    : null;

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
      setIsLoading(true);
      setOrderedTracks([]);
      setFetchedAlbumCount(0);
      try {
        const tracks = await handle.getArtistTopTracks?.(uri, 0, 5);
        if (tracks?.length) {
          dispatch(
            addTracks({
              source,
              tracks,
              addToLibrary: false
            })
          );
          setOrderedTracks(tracks.map((t) => getTrackId(source, t.uri)));
        }
      } finally {
        setIsLoading(false);
      }
    }
    fetchTracks();
  }, [dispatch, artistId]);

  useEffect(() => {
    async function fetchAlbums() {
      const requiredAlbumCount = gridLayout.columnCount + OVERSCROLL_BUFFER;
      if (!artistId || requiredAlbumCount <= OVERSCROLL_BUFFER) return;
      if (fetchedAlbumCount >= requiredAlbumCount) return;

      const artistInfo = parseArtistId(artistId);
      const handle = artistInfo && getSourceHandle(artistInfo.source);
      if (!handle || !artistInfo?.uri) return;
      const { source, uri } = artistInfo;

      const albums = await handle.getArtistAlbums?.(
        uri,
        fetchedAlbumCount,
        requiredAlbumCount
      );
      if (albums?.length) {
        dispatch(
          addAlbums({
            source,
            albums: albums.map((album) => ({
              ...album,
              albumId: getAlbumId(source, album.name, album.artist, album.uri),
              source
            }))
          })
        );
        setFetchedAlbumCount((prev) => prev + albums.length);
      }
    }
    fetchAlbums();
  }, [dispatch, artistId, fetchedAlbumCount, gridLayout.columnCount]);

  const rowData = useMemo(() => {
    if (isLoading) return [];
    if (!orderedTracks.length) return artistTracks.slice(0, 5);
    const state = store.getState();
    return orderedTracks.map((trackId) => ({
      ...selectTrackById(state, trackId),
      itemId: trackId
    }));
  }, [artistTracks, isLoading, orderedTracks]);

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
            {visibleArtist.uri && pluginHandle?.Attribution && (
              <pluginHandle.Attribution
                type="artist"
                id={visibleArtist.uri}
                compact={false}
              />
            )}
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
                  {artistAlbums
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
