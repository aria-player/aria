import styles from "./Footer.module.css";
import MusicIcon from "../../assets/music.svg?react";
import VolumeIcon from "../../assets/volume-high-solid.svg?react";
import { PlaybackControls } from "./PlaybackControls";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <section className={styles.left}>
        <MusicIcon className={styles.art} />
        <div className={styles.metadata}>
          <div className={styles.title}>Track Title</div>
          <div className={styles.artist}>Track Artist</div>
        </div>
      </section>
      <section>
        <PlaybackControls />
      </section>
      <section className={styles.right}>
        <div className={styles.volume}></div>
        <button className={styles.mute}>
          <VolumeIcon />
        </button>
      </section>
    </footer>
  );
}
