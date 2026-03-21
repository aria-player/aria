import { Trans, useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { DisplayMode, View } from "../../../app/view";
import {
  selectVisibleDisplayMode,
  selectVisibleViewType,
} from "../../../features/visibleSelectors";
import {
  getSourceHandle,
  pluginHandles,
  selectActivePlugins,
  selectPluginData,
} from "../../../features/plugins/pluginsSlice";
import styles from "./NoRowsOverlay.module.css";
import { BASEPATH } from "../../../app/constants";
import { push } from "redux-first-history";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import { sortPlugins } from "../../../app/utils";
import AppIcon from "../../../../app-icon.svg?react";
import { useIsMobileBrowser } from "../../../hooks/useIsMobileBrowser";

export default function NoRowsOverlay() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { platform } = useContext(PlatformContext);
  const isMobileBrowser = useIsMobileBrowser();
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const activePlugins = useAppSelector(selectActivePlugins);
  useAppSelector(selectPluginData); // Re-render when plugin data changes
  const configurablePlugins = activePlugins
    .filter((plugin) => pluginHandles[plugin]?.QuickStart)
    .sort(sortPlugins);

  switch (visibleViewType) {
    case View.Album:
      return <div className={styles.empty}>{t("albumTrackList.notFound")}</div>;
    case View.Artist:
      return <div className={styles.empty}>{t("artist.notFound")}</div>;
    case View.Search:
      return <div className={styles.empty}>{t("search.noResults")}</div>;
    case View.Queue:
      return <div className={styles.empty}>{t("tracks.emptyQueue")}</div>;
    default:
      if (
        visibleDisplayMode == DisplayMode.AlbumGrid ||
        visibleDisplayMode == DisplayMode.SplitView
      ) {
        return <div className={styles.empty}>{t("albumTrackList.empty")}</div>;
      } else if (visibleViewType == View.Playlist) {
        return <div className={styles.empty}>{t("tracks.emptyPlaylist")}</div>;
      } else {
        return (
          <div className={styles.quickStart}>
            {isMobileBrowser && (
              <div className={styles.splash}>
                <div className={styles.splashCard}>
                  <a
                    href="https://github.com/aria-player/aria"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.splashLink}
                  >
                    <AppIcon className={styles.splashIcon} />
                  </a>
                  <span className={styles.splashTitle}>
                    {t("sidebar.appName")}
                  </span>
                  <p>{t("tracks.mobileBrowserSplash")}</p>
                  <a
                    href="https://github.com/aria-player/aria"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.splashLink}
                  >
                    {t("tracks.viewOnGitHub")}
                  </a>
                </div>
              </div>
            )}
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
                {!isMobileBrowser && (
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
                        ),
                      }}
                    />
                  </p>
                )}
              </>
            )}
          </div>
        );
      }
  }
}
