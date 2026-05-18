import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import styles from "./PlaylistGridItem.module.css";
import { PlaylistSearchItem } from "../../../app/search";
import PlaylistArt from "./PlaylistArt";

export default function PlaylistGridItem({
  playlist,
}: {
  playlist: PlaylistSearchItem;
}) {
  const dispatch = useAppDispatch();

  function goToPlaylist() {
    dispatch(push(BASEPATH + "playlist/" + playlist.id));
  }

  return (
    <div className={styles.playlistGridItem}>
      <button
        className={styles.playlistArt}
        onClick={goToPlaylist}
        aria-label={playlist.name}
      >
        <PlaylistArt playlistId={playlist.id} />
      </button>
      <div className={styles.playlistInfo}>
        <button className={styles.playlistName} onClick={goToPlaylist}>
          {playlist.name}
        </button>
      </div>
    </div>
  );
}
