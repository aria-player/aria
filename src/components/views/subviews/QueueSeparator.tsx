import { ICellRendererParams } from "@ag-grid-community/core";
import { useAppSelector } from "../../../app/hooks";
import {
  selectQueueGrouping,
  selectQueueSelectedGroup,
  selectQueueSource
} from "../../../features/player/playerSlice";
import styles from "./QueueSeparator.module.css";
import { selectCurrentPlaylist } from "../../../features/currentSelectors";
import { selectPlaylistsLayoutItemById } from "../../../features/playlists/playlistsSlice";
import { useTranslation } from "react-i18next";
import { isLibraryView, TrackGrouping } from "../../../app/view";
import { selectAlbumTitle } from "../../../features/genericSelectors";

export default function QueueSeparator(props: ICellRendererParams) {
  const { t } = useTranslation();
  const queueSource = useAppSelector(selectQueueSource);
  const queueGrouping = useAppSelector(selectQueueGrouping);
  const queueSelectedGroup = useAppSelector(selectQueueSelectedGroup);
  const currentPlaylistId = useAppSelector(selectCurrentPlaylist)?.id;
  const playlistName = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, currentPlaylistId ?? "")
  )?.name;
  const albumTitle = useAppSelector((state) =>
    selectAlbumTitle(state, queueSelectedGroup)
  );
  const formattedGroup =
    queueGrouping == TrackGrouping.AlbumId ? albumTitle : queueSelectedGroup;

  return (
    <div className={`queue-separator ${styles.separator}`}>
      {props.node.id === "currentTrackSeparator" ? (
        t("queue.currentTrack")
      ) : props.node.id === "upNextSeparator" ? (
        t("queue.queuedTracks")
      ) : (
        <>
          {t("queue.playingFrom")}
          <span className={styles.source}>
            {playlistName ||
              formattedGroup ||
              (queueSource && isLibraryView(queueSource)
                ? t(`views.${queueSource}`)
                : queueSource && queueSource.startsWith("search")
                  ? t("search.resultsFor", {
                      search: queueSource.split("/")[1]
                    })
                  : t("queue.deletedPlaylist"))}
            {playlistName && formattedGroup && ` / ${formattedGroup}`}
          </span>
        </>
      )}
    </div>
  );
}
