import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import styles from "./ArtistGridItem.module.css";
import { ArtistDetails } from "../../../features/tracks/tracksTypes";
import { ArtistArt } from "./ArtistArt";

export default function ArtistGridItem({ artist }: { artist: ArtistDetails }) {
  const dispatch = useAppDispatch();

  function goToArtist() {
    dispatch(push(BASEPATH + "artist/" + encodeURIComponent(artist.artistId)));
  }

  return (
    <div className={styles.artistGridItem}>
      <button className={styles.artistArt} onClick={goToArtist}>
        <ArtistArt
          track={artist.firstTrack}
          altText={artist.name}
          artistId={artist.artistId}
        />
      </button>
      <button className={styles.artistName} onClick={goToArtist}>
        {artist.name}
      </button>
    </div>
  );
}
