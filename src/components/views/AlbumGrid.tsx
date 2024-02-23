import { useState } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectVisibleTracks } from "../../features/sharedSelectors";
import { selectAllTracks } from "../../features/tracks/tracksSlice";
import { Track } from "../../features/tracks/tracksTypes";
import { AlbumArt } from "../AlbumArt";
import styles from "./AlbumGrid.module.css";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";

export default function AlbumGrid() {
  const libraryTracks = useAppSelector(selectAllTracks);
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
  const [selectedItem, setSelectedItem] = useState<string | null | undefined>(
    null
  );

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
        {selectedItem && (
          <div
            className={styles.detailOuter}
            onClick={(e) => {
              setSelectedItem(null);
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
                onClick={(e) => {
                  setSelectedItem(null);
                }}
              >
                <LeftArrow />
              </button>
              <div>{selectedItem}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
