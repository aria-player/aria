import { useAppSelector } from "../../app/hooks";
import { selectVisibleTracks } from "../../features/sharedSelectors";
import { selectAllTracks } from "../../features/tracks/tracksSlice";
import { Track } from "../../features/tracks/tracksTypes";
import { AlbumArt } from "../AlbumArt";
import styles from "./AlbumGrid.module.css";

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

  return (
    <div style={{ overflowY: "auto" }}>
      <div className={styles.grid}>
        {allAlbums.map((track) => {
          if (track)
            return (
              <button
                key={track.album}
                className={styles.gridItem}
                style={{
                  display: visibleAlbums.includes(track.album)
                    ? "block"
                    : "none"
                }}
              >
                <AlbumArt track={track as Track} />
              </button>
            );
        })}
      </div>
    </div>
  );
}
