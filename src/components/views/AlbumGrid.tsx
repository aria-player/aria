import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSelectedItem,
  selectVisibleTracks
} from "../../features/sharedSelectors";
import { selectAllTracks } from "../../features/tracks/tracksSlice";
import { Track } from "../../features/tracks/tracksTypes";
import { AlbumArt } from "../AlbumArt";
import styles from "./AlbumGrid.module.css";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import { setPlaylistSelectedAlbum } from "../../features/playlists/playlistsSlice";
import { DisplayMode } from "../../app/view";
import { TrackList } from "./TrackList";

export default function AlbumGrid() {
  const dispatch = useAppDispatch();

  const libraryTracks = useAppSelector(selectAllTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedItem = useAppSelector(selectVisibleSelectedItem);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleTracks = useAppSelector(selectVisibleTracks);
  const allAlbums = [
    ...new Map(libraryTracks.map((track) => [track.album, track])).values()
  ].sort(
    (a, b) =>
      a.album?.localeCompare(b.album!, undefined, {
        sensitivity: "base",
        ignorePunctuation: true
      }) ?? 0
  );
  // TODO: Decide how to handle albums with the same name
  const visibleAlbums = [...new Set(visibleTracks.map((track) => track.album))];

  function setSelectedItem(album?: string) {
    if (visiblePlaylist?.id)
      dispatch(
        setPlaylistSelectedAlbum({
          playlistId: visiblePlaylist?.id,
          selectedAlbum: album ?? null
        })
      );
  }

  return (
    <div style={{ overflowY: "auto" }}>
      <div className={styles.grid}>
        {allAlbums.map((track) => {
          if (track)
            return (
              <div
                key={track.album}
                style={{
                  display: visibleAlbums.includes(track.album)
                    ? "block"
                    : "none"
                }}
              >
                <button
                  className={styles.gridItem}
                  onClick={() => setSelectedItem(track.album)}
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
            className={styles.detailOuter}
            onClick={() => {
              setSelectedItem();
            }}
          >
            <div
              className={styles.detailInner}
              onClick={(e) => {
                e.stopPropagation();
              }}
            >
              <button
                className={styles.backButton}
                onClick={() => {
                  setSelectedItem();
                }}
              >
                <LeftArrow />
              </button>
              <div style={{ height: "80%", margin: "2rem" }}>
                <TrackList />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
