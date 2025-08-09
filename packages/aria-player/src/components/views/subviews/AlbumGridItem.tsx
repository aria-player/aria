import { AlbumDetails } from "../../../features/tracks/tracksTypes";
import { formatStringArray } from "../../../app/utils";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { AlbumArt } from "./AlbumArt";
import styles from "./AlbumGridItem.module.css";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectVisiblePlaylist } from "../../../features/visibleSelectors";

export function AlbumGridItem({ album }: { album: AlbumDetails }) {
  const dispatch = useAppDispatch();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const pluginHandle = getSourceHandle(album.firstTrack.source);

  function goToAlbum() {
    const path = visiblePlaylist?.id
      ? `playlist/${visiblePlaylist.id}/${encodeURIComponent(album.albumId)}`
      : `albums/${encodeURIComponent(album.albumId)}`;
    dispatch(push(BASEPATH + path));
  }

  return (
    <div className={styles.albumGridItem}>
      <button className={styles.albumArt} onClick={goToAlbum}>
        <AlbumArt track={album.firstTrack} />
      </button>
      <div className={styles.albumInfo}>
        <div className={styles.albumTextContainer}>
          <div className={`${styles.albumText} ${styles.albumTitle}`}>
            {album.album}
          </div>
          <div className={`${styles.albumText} ${styles.albumArtist}`}>
            {formatStringArray(album.artist)}
          </div>
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
