import styles from "./Footer.module.css";
import { PlaybackControls } from "./PlaybackControls";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentTrack } from "../../features/sharedSelectors";
import { AuxiliaryControls } from "./AuxiliaryControls";
import { AlbumArt } from "../AlbumArt";

export function Footer() {
  const metadata = useAppSelector(selectCurrentTrack);
  const currentTrack = useAppSelector(selectCurrentTrack);

  return (
    <footer className={styles.footer}>
      <section className={styles.left}>
        <div className={styles.art}>
          <AlbumArt track={currentTrack} />
        </div>
        <div className={styles.metadata}>
          <div className={styles.title}>{metadata?.title}</div>
          <div className={styles.artist}>{metadata?.artist}</div>
        </div>
      </section>
      <section>
        <PlaybackControls />
      </section>
      <section className={styles.right}>
        <AuxiliaryControls />
      </section>
    </footer>
  );
}
