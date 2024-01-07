import { useAppSelector } from "../../app/hooks";
import { MediaSlider } from "soprano-ui";
import { selectCurrentTrack } from "../../features/sharedSelectors";

export function ProgressBar() {
  const duration = useAppSelector(selectCurrentTrack)?.duration;

  return (
    <MediaSlider
      min={0}
      max={duration ?? 0}
      step={0.1}
      keyboardStepMultiplier={10}
      thumbAlignment="center"
      keyboardFocusOnly={true}
    />
  );
}
