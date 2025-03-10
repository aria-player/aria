import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { MediaSlider } from "soprano-ui";
import { getElapsedPlayerTime, seek } from "../../features/player/playerTime";
import {
  nextTrack,
  selectRepeatMode,
  selectStatus
} from "../../features/player/playerSlice";
import { RepeatMode, Status } from "../../features/player/playerTypes";
import { store } from "../../app/store";
import { selectCurrentTrack } from "../../features/currentSelectors";

export function ProgressBar(props: {
  progressValueState: [number, (progressValue: number) => void];
}) {
  const dispatch = useAppDispatch();
  const duration = useAppSelector(selectCurrentTrack)?.duration;
  const status = useAppSelector(selectStatus);
  const [progressValue, setProgressValue] = props.progressValueState;
  const [dragging, setDragging] = useState(false);
  const disabled = duration == null || status == Status.Stopped;

  useEffect(() => {
    let progressUpdateIntervalId: number;
    if (!dragging) {
      progressUpdateIntervalId = setInterval(() => {
        const elapsedTime = getElapsedPlayerTime();
        setProgressValue(Math.min(duration ?? 0, elapsedTime));
        if (duration != null && elapsedTime >= duration) {
          if (selectRepeatMode(store.getState()) == RepeatMode.One) {
            seek(0);
          } else {
            dispatch(nextTrack());
          }
        }
      }, 100) as unknown as number;
    }
    return () => {
      clearInterval(progressUpdateIntervalId);
    };
  }, [dispatch, setProgressValue, progressValue, dragging, duration]);

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
      onPointerDown={() => {
        if (!disabled) {
          setDragging(true);
        }
      }}
      onPointerUp={() => {
        if (progressValue != null && !disabled) {
          setDragging(false);
          seek(progressValue);
        }
      }}
      onValueChange={(value) => {
        setProgressValue(value[0]);
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
            "PageDown"
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
