import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch } from "../../../app/hooks";
import { LibraryView } from "../../../app/view";
import { updateLibrarySplitState } from "../../../features/library/librarySlice";
import { AlbumArt } from "./AlbumArt";
import styles from "./ArtistGridItem.module.css";
import { ArtistDetails } from "../../../features/tracks/tracksTypes";
import { Track } from "../../../../../types";

export default function ArtistGridItem({ artist }: { artist: ArtistDetails }) {
  const dispatch = useAppDispatch();

  function goToArtist() {
    dispatch(
      updateLibrarySplitState({
        view: LibraryView.Artists,
        splitState: { selectedGroup: artist.artist }
      })
    );
    dispatch(push(BASEPATH + "artists"));
  }

  return (
    <div className={styles.artistGridItem}>
      <button className={styles.artistArt} onClick={goToArtist}>
        <AlbumArt track={{ artworkUri: artist.artworkUri } as Track} />
      </button>
      <div className={styles.artistName}>{artist.artist}</div>
    </div>
  );
}
