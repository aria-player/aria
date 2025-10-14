import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import styles from "./ArtistGridItem.module.css";
import { ArtistArt } from "./ArtistArt";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { ArtistDetails } from "../../../features/artists/artistsTypes";

export default function ArtistGridItem({ artist }: { artist: ArtistDetails }) {
  const dispatch = useAppDispatch();
  const pluginHandle = getSourceHandle(artist.source);

  function goToArtist() {
    dispatch(push(BASEPATH + "artist/" + encodeURIComponent(artist.artistId)));
  }

  return (
    <div className={styles.artistGridItem}>
      <button className={styles.artistArt} onClick={goToArtist}>
        <ArtistArt artist={artist} />
      </button>
      <div className={styles.artistInfo}>
        <button className={styles.artistName} onClick={goToArtist}>
          {artist.name}
        </button>
        {artist.uri && pluginHandle?.Attribution && (
          <div className={styles.attribution}>
            <pluginHandle.Attribution
              type="artist"
              id={artist.uri}
              compact={true}
            />
          </div>
        )}
      </div>
    </div>
  );
}
