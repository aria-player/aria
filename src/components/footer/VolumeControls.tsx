import { MediaSlider } from "soprano-ui";
import VolumeZeroIcon from "../../assets/volume-off-solid.svg?react";
import VolumeLowIcon from "../../assets/volume-low-solid.svg?react";
import VolumeHighIcon from "../../assets/volume-high-solid.svg?react";
import VolumeMutedIcon from "../../assets/volume-xmark-solid.svg?react";
import styles from "./VolumeControls.module.css";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  setVolume,
  selectMuted,
  selectVolume,
  setMuted
} from "../../features/player/playerSlice";
import { useDebounce } from "react-use";

export function VolumeControls() {
  const dispatch = useAppDispatch();
  const muted = useAppSelector(selectMuted);
  const volume = useAppSelector(selectVolume);
  const [localVolume, setLocalVolume] = useState(volume);

  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  useDebounce(() => dispatch(setVolume(localVolume)), 100, [localVolume]);

  let VolumeIcon = VolumeHighIcon;
  if (muted) {
    VolumeIcon = VolumeMutedIcon;
  } else if (localVolume < 25) {
    VolumeIcon = VolumeZeroIcon;
  } else if (localVolume < 75) {
    VolumeIcon = VolumeLowIcon;
  } else if (localVolume < 100) {
    VolumeIcon = VolumeHighIcon;
  }

  return (
    <>
      <div className={styles.volume}>
        <MediaSlider
          min={0}
          max={100}
          step={1}
          value={[muted ? 0 : localVolume]}
          keyboardStepMultiplier={10}
          keyboardFocusOnly={true}
          thumbAlignment={"center"}
          onPointerDown={() => {
            if (muted) {
              dispatch(setMuted(false));
            }
          }}
          onPointerUp={() => {
            dispatch(setVolume(localVolume));
          }}
          onValueChange={(value) => {
            setLocalVolume(value[0]);
          }}
        />
      </div>
      <button
        className={styles.mute}
        onClick={() => {
          dispatch(setMuted(!muted));
        }}
      >
        <VolumeIcon />
      </button>
    </>
  );
}
