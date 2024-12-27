import { MediaSlider } from "soprano-ui";
import VolumeZeroIcon from "../../assets/volume-off-solid.svg?react";
import VolumeLowIcon from "../../assets/volume-low-solid.svg?react";
import VolumeHighIcon from "../../assets/volume-high-solid.svg?react";
import VolumeMutedIcon from "../../assets/volume-xmark-solid.svg?react";
import styles from "./AuxiliaryControls.module.css";
import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  setVolume,
  selectMuted,
  selectVolume,
  setMuted
} from "../../features/player/playerSlice";
import { useDebounce } from "react-use";
import QueueIcon from "../../assets/list-solid.svg?react";
import { BASEPATH } from "../../app/constants";
import { goBack, push } from "redux-first-history";
import { View } from "../../app/view";
import { selectVisibleViewType } from "../../features/visibleSelectors";
import { useTranslation } from "react-i18next";
import { selectAllTracks } from "../../features/tracks/tracksSlice";
import { SyncProgress } from "./SyncProgress";
import { selectAggregateSyncProgress } from "../../features/plugins/pluginsSlice";

export function AuxiliaryControls() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const muted = useAppSelector(selectMuted);
  const volume = useAppSelector(selectVolume);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const allTracks = useAppSelector(selectAllTracks);
  const aggregateProgress = useAppSelector(selectAggregateSyncProgress);
  const scannedTracks = allTracks.filter(
    (track) => track.metadataLoaded
  ).length;
  const totalTracks = allTracks.length;
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
      {scannedTracks != totalTracks && (
        <div className={styles.scanProgress}>
          {t("footer.scanProgressLabel")} <br />
          <MediaSlider disabled value={[scannedTracks]} max={totalTracks} />
          {t("footer.scanProgress", {
            scannedTracks,
            totalTracks
          })}
        </div>
      )}
      {aggregateProgress != null && aggregateProgress < 100 && (
        <SyncProgress percentage={aggregateProgress} />
      )}
      <div className={styles.volume}>
        <MediaSlider
          min={0}
          max={100}
          step={1}
          value={[muted ? 0 : localVolume]}
          keyboardStepMultiplier={10}
          keyboardFocusOnly={true}
          thumbAlignment={"center"}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          onPointerUp={() => {
            dispatch(setVolume(localVolume));
          }}
          onValueChange={(value) => {
            if (muted) {
              dispatch(setMuted(false));
            }
            setLocalVolume(value[0]);
          }}
        />
      </div>
      <button
        className={`footer-button ${styles.button}`}
        onClick={() => {
          dispatch(setMuted(!muted));
        }}
        title={t("menu.toggleMute")}
      >
        <VolumeIcon />
      </button>
      <button
        className={`footer-button ${styles.button} ${styles.queue} ${visibleViewType == View.Queue ? styles.selected : ""}`}
        onClick={() => {
          if (visibleViewType != View.Queue) {
            dispatch(push(BASEPATH + "queue"));
          } else {
            dispatch(goBack());
          }
        }}
        title={t("views.queue")}
      >
        <QueueIcon />
      </button>
    </>
  );
}
