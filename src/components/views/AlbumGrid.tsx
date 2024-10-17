import { useAppDispatch, useAppSelector } from "../../app/hooks";

import { selectAllTracks } from "../../features/tracks/tracksSlice";
import { Track } from "../../features/tracks/tracksTypes";
import { AlbumArt } from "./subviews/AlbumArt";
import styles from "./AlbumGrid.module.css";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import { DisplayMode } from "../../app/view";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useTranslation } from "react-i18next";
import { setSelectedAlbum } from "../../features/library/librarySlice";
import { setPlaylistSelectedTrackGroup } from "../../features/playlists/playlistsSlice";
import {
  selectVisiblePlaylist,
  selectVisibleSelectedTrackGroup,
  selectVisibleDisplayMode,
  selectVisibleTrackGroups
} from "../../features/visibleSelectors";
import { useEffect, useRef } from "react";
import { store } from "../../app/store";
import { useLocation } from "react-router-dom";

export default function AlbumGrid() {
  const dispatch = useAppDispatch();

  const location = useLocation();
  const scrollDivRef = useRef<HTMLDivElement>(null);
  const albumRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { t } = useTranslation();
  const libraryTracks = useAppSelector(selectAllTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const allAlbums = [
    ...new Map(libraryTracks.map((track) => [track.albumId, track])).values()
  ].sort(
    (a, b) =>
      a.album?.localeCompare(b.album!, undefined, {
        sensitivity: "base",
        ignorePunctuation: true
      }) ?? 0
  );
  const visibleAlbums = useAppSelector(selectVisibleTrackGroups);

  function setSelectedItem(albumId?: string) {
    if (visiblePlaylist?.id) {
      dispatch(
        setPlaylistSelectedTrackGroup({
          playlistId: visiblePlaylist?.id,
          selectedGroup: albumId ?? null
        })
      );
    } else {
      dispatch(setSelectedAlbum(albumId ?? null));
    }
  }

  useEffect(() => {
    if (scrollDivRef.current) {
      const selectedItem = selectVisibleSelectedTrackGroup(store.getState());
      if (selectedItem == null) {
        scrollDivRef.current.scrollTop = 0;
      } else {
        if (selectedItem && albumRefs.current[selectedItem]) {
          albumRefs.current[selectedItem]?.scrollIntoView({
            block: "center"
          });
        }
      }
    }
  }, [location]);

  return (
    <div className={`album-grid ${styles.albumGrid}`}>
      <div
        ref={scrollDivRef}
        className={styles.grid}
        style={{ display: visibleAlbums.length == 0 ? "none" : "grid" }}
      >
        {allAlbums.map((track, index) => {
          if (track)
            return (
              <div
                key={track.albumId ?? index}
                ref={(el) => {
                  albumRefs.current[track.albumId ?? index] = el;
                }}
                style={{
                  display: visibleAlbums.includes(track.albumId)
                    ? "block"
                    : "none"
                }}
              >
                <button
                  className={`album-grid-item ${styles.gridItem}`}
                  onClick={() => setSelectedItem(track.albumId)}
                  disabled={
                    selectedItem || visibleDisplayMode != DisplayMode.AlbumGrid
                      ? true
                      : false
                  }
                >
                  <AlbumArt track={track as Track} />
                </button>
                <div className={`${styles.albumText} ${styles.albumTitle}`}>
                  {track.album}
                </div>
                <div className={`${styles.albumText} ${styles.albumArtist}`}>
                  {track.albumArtist ?? track.artist}
                </div>
              </div>
            );
        })}
        {selectedItem && visibleDisplayMode == DisplayMode.AlbumGrid && (
          <div
            className={`album-grid-overlay-background ${styles.detailOuter}`}
            onClick={(e) => {
              if (e.currentTarget === e.target) {
                setSelectedItem();
              }
            }}
          >
            <div
              className={`album-grid-overlay-foreground ${styles.detailInner}`}
            >
              <button
                className={`album-grid-overlay-back-button ${styles.backButton}`}
                onClick={() => {
                  setSelectedItem();
                }}
              >
                <LeftArrow />
              </button>
              <div
                className={`album-grid-album-track-list ${styles.albumTrackList}`}
              >
                <AlbumTrackList />
              </div>
            </div>
          </div>
        )}
      </div>
      {visibleAlbums.length == 0 && (
        <div className={styles.empty}>{t("albumGrid.empty")}</div>
      )}
    </div>
  );
}
