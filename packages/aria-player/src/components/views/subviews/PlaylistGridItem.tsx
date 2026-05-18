import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import styles from "./PlaylistGridItem.module.css";
import { PlaylistSearchItem } from "../../../app/search";
import PlaylistArt from "./PlaylistArt";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";

export default function PlaylistGridItem({
  playlist,
}: {
  playlist: PlaylistSearchItem;
}) {
  const dispatch = useAppDispatch();
  const pluginHandle = playlist.provider
    ? getSourceHandle(playlist.provider)
    : undefined;

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
        <div className={styles.playlistTextContainer}>
          <button className={styles.playlistName} onClick={goToPlaylist}>
            {playlist.name}
          </button>
          {playlist.creatorName && (
            <div className={styles.playlistCreator}>{playlist.creatorName}</div>
          )}
        </div>
        {pluginHandle?.Attribution && (
          <pluginHandle.Attribution
            type="playlist"
            id={playlist.id}
            compact={true}
          />
        )}
      </div>
    </div>
  );
}
