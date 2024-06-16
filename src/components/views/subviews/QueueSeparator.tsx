import { ICellRendererParams } from "@ag-grid-community/core";
import { useAppSelector } from "../../../app/hooks";
import { selectQueueSource } from "../../../features/player/playerSlice";
import styles from "./QueueSeparator.module.css";
import { selectCurrentPlaylist } from "../../../features/currentSelectors";
import { selectPlaylistsLayoutItemById } from "../../../features/playlists/playlistsSlice";
import { useTranslation } from "react-i18next";
import { isLibraryView } from "../../../app/view";

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

  return (
    <div className={styles.separator}>
      {props.node.id === "currentTrackSeparator" ? (
        t("queue.currentTrack")
      ) : props.node.id === "upNextSeparator" ? (
        t("queue.queuedTracks")
      ) : (
        <>
          {t("queue.playingFrom")}
          <span className={styles.source}>
            {playlistName ||
              currentGroup ||
              (queueSource && isLibraryView(queueSource)
                ? t(`views.${queueSource}`)
                : queueSource && queueSource.startsWith("search")
                  ? t("search.resultsFor", {
                      search: queueSource.split("/")[1]
                    })
                  : t("queue.deletedPlaylist"))}
            {playlistName && currentGroup && ` / ${currentGroup}`}
          </span>
        </>
      )}
    </div>
  );
}
