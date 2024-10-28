import { Trans, useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { DisplayMode, View } from "../../../app/view";
import {
  selectVisibleDisplayMode,
  selectVisibleViewType
} from "../../../features/visibleSelectors";
import {
  getSourceHandle,
  pluginHandles,
  selectActivePlugins
} from "../../../features/plugins/pluginsSlice";
import styles from "./NoRowsOverlay.module.css";
import { BASEPATH } from "../../../app/constants";
import { push } from "redux-first-history";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";

export default function NoRowsOverlay() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { platform } = useContext(PlatformContext);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const activePlugins = useAppSelector(selectActivePlugins);
  const configurablePlugins = activePlugins.filter(
    (plugin) => pluginHandles[plugin]?.QuickStart
  );

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
            {configurablePlugins.length == 0 &&
              platform == Platform.Web &&
              !("showDirectoryPicker" in window) && (
                <>
                  <h2>{t("tracks.localFilesNotSupported")}</h2>
                  <p>{t("tracks.localFilesNotSupportedSubtitle")}</p>
                </>
              )}
            {configurablePlugins.length > 0 && (
              <>
                <h2>{t("tracks.quickStart")}</h2>
                {configurablePlugins?.map((plugin) => {
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
              </>
            )}
          </div>
        );
      }
  }
}
