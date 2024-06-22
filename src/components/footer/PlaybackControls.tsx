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
  loadAndPlayTrack,
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
import { formatDuration } from "../../app/utils";
import { ProgressBar } from "./ProgressBar";
import { useState } from "react";
import {
  selectDisplayRemainingTime,
  setDisplayRemainingTime
} from "../../features/config/configSlice";
import { selectCurrentTrack } from "../../features/currentSelectors";
import { useTranslation } from "react-i18next";
import { store } from "../../app/store";

export function PlaybackControls() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

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
        {metadata && (
          <div className={styles.time}>{formatDuration(progressValue)}</div>
        )}
        <div className={styles.controls}>
          <button
            className={`${styles.button} ${shuffle ? styles.selected : ""}`}
            onClick={() => {
              dispatch(toggleShuffle());
            }}
            title={t("menu.toggleShuffle")}
          >
            <ShuffleIcon />
          </button>
          <button
            className={styles.button}
            onClick={() => {
              restartOrPreviousTrack();
            }}
            title={t("menu.previous")}
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
              } else {
                const state = store.getState();
                if (state.player.currentTrack == null) return;
                dispatch(loadAndPlayTrack(state.player.currentTrack.trackId));
              }
            }}
            title={t("menu.togglePlay")}
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
            title={t("menu.next")}
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
            title={t("menu.toggleRepeat")}
          >
            {repeatMode == RepeatMode.One ? <RepeatOneIcon /> : <RepeatIcon />}
          </button>
        </div>
        {metadata && (
          <button
            className={`${styles.time} ${styles.durationButton}`}
            onClick={() => {
              dispatch(setDisplayRemainingTime(!displayRemainingTime));
            }}
            title={t("footer.toggleTimeDisplay")}
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
