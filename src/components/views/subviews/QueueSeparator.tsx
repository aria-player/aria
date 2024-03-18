import { ICellRendererParams } from "@ag-grid-community/core";
import { useAppSelector } from "../../../app/hooks";
import { selectQueueSource } from "../../../features/player/playerSlice";
import styles from "./QueueSeparator.module.css";
import { selectCurrentPlaylist } from "../../../features/currentSelectors";
import { selectPlaylistsLayoutItemById } from "../../../features/playlists/playlistsSlice";
import { useTranslation } from "react-i18next";

export default function QueueSeparator(props: ICellRendererParams) {
  const { t } = useTranslation();
  const queueSource = useAppSelector(selectQueueSource);
  const currentPlaylistId = useAppSelector(selectCurrentPlaylist)?.id;
  const playlistName = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, currentPlaylistId ?? "")
  )?.name;
  const currentGroup = useAppSelector(
    (state) => state.player.queueSelectedGroup
  );

  return props.node.rowIndex === 0 ? (
    <div className={styles.separator}>{t("queue.currentTrack")}</div>
  ) : (
    <div className={styles.separator}>
      {t("queue.playingFrom")}
      <span className={styles.source}>
        {playlistName || currentGroup || t(`views.${queueSource}`)}
        {playlistName && currentGroup && ` / ${currentGroup}`}
      </span>
    </div>
  );
}
