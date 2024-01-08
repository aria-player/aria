import styles from "./PlaybackControls.module.css";
import PauseIcon from "../../assets/pause.svg?react";
import PlayIcon from "../../assets/play.svg?react";
import ForwardIcon from "../../assets/skip-forward.svg?react";
import BackwardIcon from "../../assets/skip-back.svg?react";
import RepeatIcon from "../../assets/repeat-solid.svg?react";
import ShuffleIcon from "../../assets/shuffle-solid.svg?react";
import { pause, resume, selectStatus } from "../../features/player/playerSlice";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Status } from "../../features/player/playerTypes";
import { selectCurrentTrack } from "../../features/sharedSelectors";
import { formatDuration } from "../../app/utils";
import { ProgressBar } from "./ProgressBar";
import { useState } from "react";

export function PlaybackControls() {
  const dispatch = useAppDispatch();

  const metadata = useAppSelector(selectCurrentTrack);
  const status = useAppSelector(selectStatus);
  const [progressValue, setProgressValue] = useState(0);
  return (
    <>
      <ProgressBar progressValueState={[progressValue, setProgressValue]} />
      <div className={styles.playback}>
        {status != Status.Stopped && (
          <div className={styles.time}>{formatDuration(progressValue)}</div>
        )}
        <div className={styles.controls}>
          <button className={styles.button}>
            <ShuffleIcon />
          </button>
          <button className={styles.button}>
            <BackwardIcon />
          </button>
          <button
            className={styles.button}
            onClick={() => {
              if (status == Status.Playing) {
                dispatch(pause());
              } else if (status == Status.Paused) {
                dispatch(resume());
              }
            }}
          >
            {status === Status.Playing ? <PauseIcon /> : <PlayIcon />}
          </button>
          <button className={styles.button}>
            <ForwardIcon />
          </button>
          <button className={styles.button}>
            <RepeatIcon />
          </button>
        </div>
        {status != Status.Stopped && (
          <div className={styles.time}>
            {metadata?.duration ? formatDuration(metadata?.duration) : "0:00"}
          </div>
        )}
      </div>
    </>
  );
}
