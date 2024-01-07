import styles from "./Footer.module.css";
import MusicIcon from "../../assets/music.svg?react";
import { PlaybackControls } from "./PlaybackControls";
import { useAppSelector } from "../../app/hooks";
import { selectCurrentTrack } from "../../features/sharedSelectors";
import { VolumeControls } from "./VolumeControls";

export function Footer() {
  const metadata = useAppSelector(selectCurrentTrack);

  return (
    <footer className={styles.footer}>
      <section className={styles.left}>
        <MusicIcon className={styles.art} />
        <div className={styles.metadata}>
          <div className={styles.title}>{metadata?.title}</div>
          <div className={styles.artist}>{metadata?.artist}</div>
        </div>
      </section>
      <section>
        <PlaybackControls />
      </section>
      <section className={styles.right}>
        <VolumeControls />
      </section>
    </footer>
  );
}
