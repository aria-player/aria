import { AlbumDetails } from "../../../features/tracks/tracksTypes";
import { formatStringArray } from "../../../app/utils";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { AlbumArt } from "./AlbumArt";
import styles from "./AlbumGridItem.module.css";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectVisiblePlaylist,
  selectVisibleViewType
} from "../../../features/visibleSelectors";
import { LibraryView } from "../../../app/view";

export function AlbumGridItem({ album }: { album: AlbumDetails }) {
  const dispatch = useAppDispatch();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const pluginHandle = getSourceHandle(album.firstTrack.source);
  const visibleViewType = useAppSelector(selectVisibleViewType);

  function goToAlbum() {
    const path = visiblePlaylist?.id
      ? `playlist/${visiblePlaylist.id}/${encodeURIComponent(album.albumId)}`
      : `${visibleViewType == LibraryView.Albums ? "albums" : "album"}/${encodeURIComponent(album.albumId)}`;
    dispatch(push(BASEPATH + path));
  }

  function goToArtist(artist: string) {
    dispatch(push(BASEPATH + `artist/${encodeURIComponent(artist)}`));
  }

  return (
    <div className={styles.albumGridItem}>
      <button className={styles.albumArt} onClick={goToAlbum}>
        <AlbumArt track={album.firstTrack} />
      </button>
      <div className={styles.albumInfo}>
        <div className={styles.albumTextContainer}>
          <button
            className={`${styles.albumText} ${styles.albumTitle}`}
            onClick={goToAlbum}
          >
            {album.album}
          </button>
          <button
            className={`${styles.albumText} ${styles.albumArtist}`}
            onClick={() => {
              if (album.artist) {
                // TODO: Use separate buttons for multiple album artists
                goToArtist(
                  Array.isArray(album.artist) ? album.artist[0] : album.artist
                );
              }
            }}
          >
            {formatStringArray(album.artist)}
          </button>
        </div>
        {album.albumId && pluginHandle?.Attribution && (
          <pluginHandle.Attribution
            type="album"
            id={album.albumId}
            compact={true}
          />
        )}
      </div>
    </div>
  );
}
