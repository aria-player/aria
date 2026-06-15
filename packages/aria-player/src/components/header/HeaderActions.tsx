import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../app/hooks";
import { View } from "../../app/view";
import { parseExternalPlaylistId } from "../../app/utils";
import { showToast } from "../../app/toasts";
import { getExternalPlaylistsHandle } from "../../features/plugins/pluginsSlice";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
} from "../../features/visibleSelectors";
import styles from "./Header.module.css";

export default function HeaderActions() {
  const { t } = useTranslation();
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);
  const handle = visiblePlaylist?.provider
    ? getExternalPlaylistsHandle(visiblePlaylist.provider)
    : undefined;
  if (
    visibleViewType !== View.Playlist ||
    !visiblePlaylist ||
    visiblePlaylist.permissions !== "read" ||
    addedPlaylistId === visiblePlaylist.id ||
    !handle?.addPlaylistToRemoteLibrary
  )
    return null;

  const addToLibrary = () => {
    const id = visiblePlaylist.id;
    const name = visiblePlaylist.name;
    const rawId = parseExternalPlaylistId(id)?.rawId ?? id;
    setAddedPlaylistId(id);
    handle.addPlaylistToRemoteLibrary?.(rawId)?.catch((error) => {
      setAddedPlaylistId((current) => (current === id ? null : current));
      console.error("Failed to add playlist to library:", error);
      showToast(t("toasts.addPlaylistToLibraryError", { name }));
    });
  };

  return (
    <div className={styles.headerActions}>
      <button className={styles.actionButton} onClick={addToLibrary}>
        {t("playlists.addToLibrary")}
      </button>
    </div>
  );
}
