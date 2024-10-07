import { Trans, useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { DisplayMode, View } from "../../../app/view";
import {
  selectVisibleDisplayMode,
  selectVisibleViewType
} from "../../../features/visibleSelectors";
import {
  getSourceHandle,
  selectActivePlugins
} from "../../../features/plugins/pluginsSlice";
import styles from "./NoRowsOverlay.module.css";
import { BASEPATH } from "../../../app/constants";
import { push } from "redux-first-history";

export default function NoRowsOverlay() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const activePlugins = useAppSelector(selectActivePlugins);

  switch (visibleViewType) {
    case View.Search:
      return <div className={styles.empty}>{t("search.noResults")}</div>;
    case View.Playlist:
      return <div className={styles.empty}>{t("tracks.emptyPlaylist")}</div>;
    case View.Queue:
      return <div className={styles.empty}>{t("tracks.emptyQueue")}</div>;
    default:
      if (
        visibleDisplayMode == DisplayMode.AlbumGrid ||
        visibleDisplayMode == DisplayMode.SplitView
      ) {
        return <div className={styles.empty}>{t("albumTrackList.empty")}</div>;
      } else {
        return (
          <div className={styles.quickStart}>
            <h2>{t("tracks.quickStart")}</h2>
            {activePlugins?.map((plugin) => {
              const pluginHandle = getSourceHandle(plugin);
              return (
                pluginHandle?.QuickStart && (
                  <section key={plugin}>
                    <pluginHandle.QuickStart />
                  </section>
                )
              );
            })}
            <p>
              <Trans
                i18nKey="tracks.librarySettingsShortcut"
                components={{
                  a: (
                    <button
                      onClick={() =>
                        dispatch(push(BASEPATH + "settings/library"))
                      }
                      className={styles.link}
                    />
                  )
                }}
              />
            </p>
          </div>
        );
      }
  }
}
