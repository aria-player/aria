import styles from "./Footer.module.css";
import MusicIcon from "../../assets/music.svg?react";
import VolumeIcon from "../../assets/volume-high-solid.svg?react";
import { PlaybackControls } from "./PlaybackControls";
import { MediaSlider } from "soprano-ui";

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
        <div className={styles.volume}>
          <MediaSlider
            step={0.1}
            keyboardStepMultiplier={10}
            keyboardFocusOnly={true}
            thumbAlignment={"center"}
          />
        </div>
        <button className={styles.mute}>
          <VolumeIcon />
        </button>
      </section>
    </footer>
  );
}
