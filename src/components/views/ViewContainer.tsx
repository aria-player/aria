import DebugView from "./DebugView";
import { useAppSelector } from "../../app/hooks";
import { DisplayMode, View } from "../../app/view";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";
import styles from "./ViewContainer.module.css";
import { SplitView } from "./SplitView";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import { Queue } from "./Queue";
import { useTranslation } from "react-i18next";
import { selectPlaylistsLayoutItemById } from "../../features/playlists/playlistsSlice";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const { t } = useTranslation();
  const currentPlaylistId = useAppSelector(selectVisiblePlaylist)?.id;
  const playlistName = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, currentPlaylistId ?? "")
  )?.name;

  return (
    <>
      <header
        className={styles.header}
        style={{
          borderBottom:
            visibleDisplayMode != DisplayMode.TrackList
              ? `1px solid var(--sidebar-separator)`
              : ""
        }}
      >
        <h1>{playlistName || t(`views.${visibleViewType}`)}</h1>
      </header>
      {visibleViewType == View.Queue && <Queue />}
      {visibleDisplayMode == DisplayMode.TrackList && (
        <div style={{ height: "100%", width: "100%" }}>
          <TrackList />
        </div>
      )}
      <div
        style={{
          height: "100%",
          width: "100%",
          overflow: "auto",
          display:
            visibleDisplayMode == DisplayMode.AlbumGrid ? "block" : "none"
        }}
      >
        <AlbumGrid />
      </div>
      {visibleDisplayMode == DisplayMode.SplitView && <SplitView />}
      {visibleDisplayMode == DisplayMode.DebugView && <DebugView />}
    </>
  );
}
