import styles from "./PlaybackControls.module.css";
import PauseIcon from "../../assets/pause.svg?react";
import ForwardIcon from "../../assets/skip-forward.svg?react";
import BackwardIcon from "../../assets/skip-back.svg?react";
import RepeatIcon from "../../assets/repeat-solid.svg?react";
import ShuffleIcon from "../../assets/shuffle-solid.svg?react";
import { MediaSlider } from "soprano-ui";

export function PlaybackControls() {
  return (
    <>
      <MediaSlider
        step={0.1}
        keyboardStepMultiplier={10}
        keyboardFocusOnly={true}
        thumbAlignment={"center"}
      />
      <div className={styles.playback}>
        <div className={styles.time}>0:00</div>
        <div className={styles.controls}>
          <button className={styles.button}>
            <ShuffleIcon />
          </button>
          <button className={styles.button}>
            <BackwardIcon />
          </button>
          <button className={styles.button}>
            <PauseIcon />
          </button>
          <button className={styles.button}>
            <ForwardIcon />
          </button>
          <button className={styles.button}>
            <RepeatIcon />
          </button>
        </div>
        <div className={styles.time}>0:00</div>
      </div>
    </>
  );
}
