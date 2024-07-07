import { useTranslation } from "react-i18next";
import { useAppSelector } from "../../../app/hooks";
import { DisplayMode, View } from "../../../app/view";
import {
  selectVisibleDisplayMode,
  selectVisibleViewType
} from "../../../features/visibleSelectors";
import {
  pluginHandles,
  selectActivePlugins
} from "../../../features/plugins/pluginsSlice";
import { plugins } from "../../../plugins/plugins";
import { SourceHandle } from "../../../features/plugins/pluginsTypes";
import styles from "./NoRowsOverlay.module.css";

export default function NoRowsOverlay() {
  const { t } = useTranslation();
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const activePlugins = useAppSelector(selectActivePlugins);

  switch (visibleViewType) {
    case View.Search:
      return <div>{t("search.noResults")}</div>;
    case View.Playlist:
      return <div>{t("tracks.emptyPlaylist")}</div>;
    case View.Queue:
      return <div>{t("tracks.emptyQueue")}</div>;
    default:
      if (
        visibleDisplayMode == DisplayMode.AlbumGrid ||
        visibleDisplayMode == DisplayMode.SplitView
      ) {
        return <div>{t("albumTrackList.empty")}</div>;
      } else {
        return (
          <div className={styles.quickStart}>
            <h2>{t("tracks.quickStart")}</h2>
            {activePlugins?.map((plugin) => {
              if (plugins[plugin].type != "source") return null;
              const pluginHandle = pluginHandles[plugin] as SourceHandle;
              return (
                pluginHandle?.QuickStart && (
                  <section key={plugin}>
                    <pluginHandle.QuickStart />
                  </section>
                )
              );
            })}
          </div>
        );
      }
  }
}
