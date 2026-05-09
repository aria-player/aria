import { useState, useEffect } from "react";
import { useAppSelector } from "../../app/hooks";
import { MediaSlider } from "soprano-ui";
import {
  getElapsedPlayerTime,
  restartOrNextTrack,
  seek,
} from "../../features/player/playerTime";
import { selectStatus } from "../../features/player/playerSlice";
import { Status } from "../../features/player/playerTypes";
import { selectCurrentTrack } from "../../features/currentSelectors";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { store } from "../../app/store";
import { formatDuration } from "../../app/utils";
import { useTranslation } from "react-i18next";

export function ProgressBar(props: {
  progressValueState: [number, (progressValue: number) => void];
}) {
  const { t } = useTranslation();
  const duration = useAppSelector(selectCurrentTrack)?.duration;
  const status = useAppSelector(selectStatus);
  const [progressValue, setProgressValue] = props.progressValueState;
  const [dragging, setDragging] = useState(false);
  const disabled =
    duration == null || status == Status.Stopped || status == Status.Loading;

  useEffect(() => {
    let progressUpdateIntervalId: number;
    if (!dragging) {
      progressUpdateIntervalId = setInterval(() => {
        const elapsedTime = getElapsedPlayerTime();
        setProgressValue(Math.min(duration ?? 0, elapsedTime));
        if (
          duration != null &&
          elapsedTime >= duration &&
          status == Status.Playing
        ) {
          const source = selectCurrentTrack(store.getState())?.source;
          if (!source) return;
          const sourceHandle = getSourceHandle(source);
          if (!sourceHandle?.disableAutomaticTrackSkip) {
            restartOrNextTrack();
          }
        }
      }, 100) as unknown as number;
    }
    return () => {
      clearInterval(progressUpdateIntervalId);
    };
  }, [setProgressValue, progressValue, dragging, duration, status]);

  const positionText =
    duration != null
      ? t("footer.playbackPositionValue", {
          position: formatDuration(progressValue),
          duration: formatDuration(duration),
        })
      : formatDuration(progressValue);

  return (
    <MediaSlider
      min={0}
      max={duration ?? 1}
      step={0.1}
      keyboardStepMultiplier={100000}
      thumbAlignment="center"
      keyboardFocusOnly={true}
      disabled={disabled}
      value={[progressValue ?? 1]}
      aria-label={t("footer.playbackPosition")}
      aria-valuetext={positionText}
      onPointerDown={() => {
        setDragging(true);
      }}
      onPointerUp={() => {
        if (progressValue != null && dragging) {
          setDragging(false);
          seek(progressValue);
        }
      }}
      onValueChange={(value) => {
        if (!disabled) {
          setProgressValue(value[0]);
        }
      }}
      onKeyDown={(e) => {
        setDragging(true);
        e.stopPropagation();
      }}
      onKeyUp={(e) => {
        if (
          [
            "Home",
            "End",
            "ArrowLeft",
            "ArrowRight",
            "ArrowUp",
            "ArrowDown",
            "PageUp",
            "PageDown",
          ].includes(e.key)
        ) {
          seek(progressValue);
        }
        setDragging(false);
      }}
      onBlur={() => {
        setDragging(false);
      }}
    />
  );
}
