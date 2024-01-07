import { MediaSlider } from "soprano-ui";
import VolumeIcon from "../../assets/volume-high-solid.svg?react";
import styles from "./VolumeControls.module.css";

export function VolumeControls() {
  return (
    <>
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
    </>
  );
}
