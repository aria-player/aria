import { useState, useEffect } from "react";
import { useAppSelector } from "../../app/hooks";
import { MediaSlider } from "soprano-ui";
import { selectCurrentTrack } from "../../features/sharedSelectors";
import { getElapsedPlayerTime, seek } from "../../features/player/playerTime";

export function ProgressBar(props: {
  progressValueState: [number, (progressValue: number) => void];
}) {
  const duration = useAppSelector(selectCurrentTrack)?.duration;
  const [progressValue, setProgressValue] = props.progressValueState;
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let progressUpdateIntervalId: number;
    if (!dragging) {
      progressUpdateIntervalId = setInterval(() => {
        setProgressValue(Math.min(duration ?? 0, getElapsedPlayerTime()));
      }, 100) as unknown as number;
    }
    return () => {
      clearInterval(progressUpdateIntervalId);
    };
  }, [setProgressValue, progressValue, dragging, duration]);

  return (
    <MediaSlider
      min={0}
      max={duration ?? 1}
      step={0.1}
      keyboardStepMultiplier={100000}
      thumbAlignment="center"
      keyboardFocusOnly={true}
      disabled={duration == null}
      value={[progressValue ?? 1]}
      onPointerDown={() => {
        setDragging(true);
      }}
      onPointerUp={() => {
        if (progressValue != null) {
          setDragging(false);
          seek(progressValue);
        }
      }}
      onValueChange={(value) => {
        setProgressValue(value[0]);
      }}
      onKeyDown={() => {
        setDragging(true);
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
