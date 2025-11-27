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
import { normalizeArtists } from "../../../app/utils";
import { selectArtistDelimiter } from "../../../features/config/configSlice";
import { AlbumDetails } from "../../../features/albums/albumsTypes";

export function AlbumGridItem({ album }: { album: AlbumDetails }) {
  const dispatch = useAppDispatch();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const pluginHandle = getSourceHandle(album.source);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const delimiter = useAppSelector(selectArtistDelimiter);

  function goToAlbum() {
    const path = visiblePlaylist?.id
      ? `playlist/${visiblePlaylist.id}/${encodeURIComponent(album.albumId)}`
      : `${visibleViewType == LibraryView.Albums ? "albums" : "album"}/${encodeURIComponent(album.albumId)}`;
    dispatch(push(BASEPATH + path));
  }

  function goToArtist(id: string) {
    dispatch(push(BASEPATH + `artist/${encodeURIComponent(id)}`));
  }
  const albumArtists = normalizeArtists(
    album.artist,
    album.artistUri,
    album.source,
    delimiter
  );

  return (
    <div className={styles.albumGridItem}>
      <button className={styles.albumArt} onClick={goToAlbum}>
        <AlbumArt album={album} />
      </button>
      <div className={styles.albumInfo}>
        <div className={styles.albumTextContainer}>
          <button
            className={`${styles.albumText} ${styles.albumTitle}`}
            onClick={goToAlbum}
          >
            {album.name}
          </button>
          <div className={styles.artistButtons}>
            {albumArtists.map((artist, index) => (
              <span key={index} className={styles.artistButtonContainer}>
                <button
                  className={`${styles.albumText} ${styles.albumArtist}`}
                  onClick={() => goToArtist(artist.id)}
                >
                  {albumArtists[index].name}
                </button>
                {index < albumArtists.length - 1 && "/"}
              </span>
            ))}
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
