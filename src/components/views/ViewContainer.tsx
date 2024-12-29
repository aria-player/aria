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
import { selectSearch } from "../../features/search/searchSlice";
import PluginAlertDialog from "./subviews/PluginAlertDialog";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const { t } = useTranslation();
  const currentPlaylistId = useAppSelector(selectVisiblePlaylist)?.id;
  const playlistName = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, currentPlaylistId ?? "")
  )?.name;
  const search = useAppSelector(selectSearch);

  return (
    <>
      <PluginAlertDialog />
      <header
        className={`header ${styles.header} ${visibleDisplayMode != DisplayMode.TrackList ? styles.border : ""}`}
      >
        <h1>
          {visibleViewType == View.Search
            ? search == ""
              ? t("views.search")
              : t("search.resultsFor", { search })
            : playlistName ||
              t(`views.${visibleViewType}`, { defaultValue: t("views.error") })}
        </h1>
      </header>
      {visibleViewType == View.Queue && <Queue />}
      {visibleDisplayMode == DisplayMode.TrackList && (
        <div style={{ height: "100%", width: "100%" }}>
          <TrackList />
        </div>
      )}
      {visibleDisplayMode == DisplayMode.AlbumGrid && (
        <div
          style={{
            height: "100%",
            width: "100%",
            overflow: "auto"
          }}
        >
          <AlbumGrid />
        </div>
      )}
      {visibleDisplayMode == DisplayMode.SplitView && <SplitView />}
    </>
  );
}
