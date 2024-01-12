import styles from "./PlaybackControls.module.css";
import PauseIcon from "../../assets/pause.svg?react";
import PlayIcon from "../../assets/play.svg?react";
import ForwardIcon from "../../assets/skip-forward.svg?react";
import BackwardIcon from "../../assets/skip-back.svg?react";
import RepeatIcon from "../../assets/repeat-solid.svg?react";
import RepeatOneIcon from "../../assets/repeat-solid-one.svg?react";
import ShuffleIcon from "../../assets/shuffle-solid.svg?react";
import {
  cycleRepeatMode,
  nextTrack,
  pause,
  resume,
  selectRepeatMode,
  selectShuffle,
  selectStatus,
  toggleShuffle
} from "../../features/player/playerSlice";
import { restartOrPreviousTrack } from "../../features/player/playerTime";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { RepeatMode, Status } from "../../features/player/playerTypes";
import { selectCurrentTrack } from "../../features/sharedSelectors";
import { formatDuration } from "../../app/utils";
import { ProgressBar } from "./ProgressBar";
import { useState } from "react";
import {
  selectDisplayRemainingTime,
  setDisplayRemainingTime
} from "../../features/config/configSlice";

export function PlaybackControls() {
  const dispatch = useAppDispatch();

  const metadata = useAppSelector(selectCurrentTrack);
  const status = useAppSelector(selectStatus);
  const repeatMode = useAppSelector(selectRepeatMode);
  const shuffle = useAppSelector(selectShuffle);
  const displayRemainingTime = useAppSelector(selectDisplayRemainingTime);
  const [progressValue, setProgressValue] = useState(0);
  return (
    <>
      <ProgressBar progressValueState={[progressValue, setProgressValue]} />
      <div className={styles.playback}>
        {status != Status.Stopped && (
          <div className={styles.time}>{formatDuration(progressValue)}</div>
        )}
        <div className={styles.controls}>
          <button
            className={`${styles.button} ${shuffle ? styles.selected : ""}`}
            onClick={() => {
              dispatch(toggleShuffle());
            }}
          >
            <ShuffleIcon />
          </button>
          <button
            className={styles.button}
            onClick={() => {
              restartOrPreviousTrack();
            }}
          >
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
            {status === Status.Playing || status === Status.Loading ? (
              <PauseIcon />
            ) : (
              <PlayIcon />
            )}
          </button>
          <button
            className={styles.button}
            onClick={() => {
              dispatch(nextTrack());
            }}
          >
            <ForwardIcon />
          </button>
          <button
            className={`${styles.button} ${
              repeatMode != RepeatMode.Off ? styles.selected : ""
            }`}
            onClick={() => {
              dispatch(cycleRepeatMode());
            }}
          >
            {repeatMode == RepeatMode.One ? <RepeatOneIcon /> : <RepeatIcon />}
          </button>
        </div>
        {status != Status.Stopped && (
          <button
            className={`${styles.time} ${styles.durationButton}`}
            onClick={() => {
              dispatch(setDisplayRemainingTime(!displayRemainingTime));
            }}
          >
            {metadata?.duration
              ? (displayRemainingTime ? "-" : "") +
                formatDuration(
                  displayRemainingTime
                    ? metadata?.duration - progressValue
                    : metadata?.duration
                )
              : "0:00"}
          </button>
        )}
      </div>
    </>
  );
}
