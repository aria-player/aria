import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import { AlbumArt } from "./AlbumArt";
import styles from "./ArtistGridItem.module.css";
import { ArtistDetails } from "../../../features/tracks/tracksTypes";

export default function ArtistGridItem({ artist }: { artist: ArtistDetails }) {
  const dispatch = useAppDispatch();

  function goToArtist() {
    dispatch(push(BASEPATH + "artist/" + encodeURIComponent(artist.artist)));
  }

  return (
    <div className={styles.artistGridItem}>
      <button className={styles.artistArt} onClick={goToArtist}>
        <AlbumArt
          track={artist.firstTrack}
          altText={artist.artist}
          artistId={artist.artistId}
        />
      </button>
      <button className={styles.artistName} onClick={goToArtist}>
        {artist.artist}
      </button>
    </div>
  );
}
