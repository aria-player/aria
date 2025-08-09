import { AgGridReact } from "@ag-grid-community/react";
import { useMemo } from "react";
import { push } from "redux-first-history";
import { Track } from "../../../../../types";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { formatStringArray } from "../../../app/utils";
import { selectSearch } from "../../../features/search/searchSlice";
import {
  selectAllArtists,
  selectAllAlbums
} from "../../../features/tracks/tracksSlice";
import { selectVisibleTracks } from "../../../features/visibleSelectors";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { AlbumArt } from "../../views/subviews/AlbumArt";
import { TrackSummaryRow } from "../../views/subviews/TrackSummaryRow";
import styles from "./SearchResults.module.css";
import { useTranslation } from "react-i18next";

export default function SearchResults() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const songResults = useAppSelector(selectVisibleTracks);
  const allArtists = useAppSelector(selectAllArtists);
  const allAlbums = useAppSelector(selectAllAlbums);
  const { gridRef, gridProps } = useTrackGrid();

  const artistResults = useMemo(() => {
    if (!search) return [];
    return allArtists.filter((artist) =>
      artist.artist.toLowerCase().includes(search.toLowerCase())
    );
  }, [allArtists, search]);

  const albumResults = useMemo(() => {
    if (!search) return [];
    return allAlbums.filter((album) =>
      album.album.toLowerCase().includes(search.toLowerCase())
    );
  }, [allAlbums, search]);

  const goToArtist = (artist: string) => {
    dispatch(push(BASEPATH + "artists/" + encodeURIComponent(artist)));
  };

  const goToAlbum = (albumId: string) => {
    dispatch(push(BASEPATH + "albums/" + encodeURIComponent(albumId)));
  };

  if (songResults.length === 0) {
    return <div className={styles.noResults}>{t("search.noResults")}</div>;
  }

  return (
    <div className={styles.searchResults}>
      {songResults.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t("search.categories.songs")}
          </h2>
          <div
            style={{ height: 48 * Math.min(5, songResults.length) + 8 }}
            className="ag-theme-balham ag-overrides-track-summary-rows"
          >
            <AgGridReact
              {...gridProps}
              ref={gridRef}
              rowData={songResults}
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
          <h2 className={styles.sectionTitle}>
            {t("search.categories.artists")}
          </h2>
          <div className={styles.horizontalList}>
            {artistResults.map((artist) => (
              <div
                key={artist.artist}
                className={styles.artistItem}
                onClick={() => goToArtist(artist.artist)}
              >
                <div className={styles.artistArt}>
                  <AlbumArt
                    track={{ artworkUri: artist.artworkUri } as Track}
                  />
                </div>
                <div className={styles.artistInfo}>
                  <div className={styles.artistName}>{artist.artist}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {albumResults.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            {t("search.categories.albums")}
          </h2>
          <div className={styles.horizontalList}>
            {albumResults.map((album) => (
              <div
                key={album.albumId}
                className={styles.albumItem}
                onClick={() => goToAlbum(album.albumId)}
              >
                <button className={styles.albumArt}>
                  <AlbumArt track={album.firstTrack} />
                </button>
                <div className={styles.albumInfo}>
                  <div className={styles.albumTextContainer}>
                    <div className={`${styles.albumText} ${styles.albumTitle}`}>
                      {album.album}
                    </div>
                    <div
                      className={`${styles.albumText} ${styles.albumArtist}`}
                    >
                      {formatStringArray(album.artist)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
