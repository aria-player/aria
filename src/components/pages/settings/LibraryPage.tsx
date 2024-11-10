import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { PluginId } from "../../../features/plugins/pluginsTypes";
import { useAppSelector } from "../../../app/hooks";
import {
  pluginHandles,
  selectActivePlugins,
  selectPluginData,
  selectPluginInfo
} from "../../../features/plugins/pluginsSlice";
import { selectAllTracks } from "../../../features/tracks/tracksSlice";
import { sortDefaultPluginsFirst } from "../../../app/utils";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";

export function LibraryPage() {
  const { t } = useTranslation();
  const { platform } = useContext(PlatformContext);
  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginData = useAppSelector(selectPluginData);
  const allTracks = useAppSelector(selectAllTracks);
  const totalTracks = allTracks.length;
  const plugins = useAppSelector(selectPluginInfo);
  const activeSourcePlugins = activePlugins
    .filter((plugin: PluginId) =>
      plugins[plugin].capabilities?.includes("source")
    )
    .sort(sortDefaultPluginsFirst);

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.library")}</h3>
      <p>{t("settings.library.subtitle")}</p>
      <hr />
      {platform == Platform.Web && !("showDirectoryPicker" in window) ? (
        <div className={styles.alert}>
          <i>{t("tracks.localFilesNotSupported")}</i>
        </div>
      ) : (
        activeSourcePlugins.length == 0 && (
          <div className={styles.alert}>
            <i>{t("settings.library.noSources")}</i>
          </div>
        )
      )}
      {activeSourcePlugins?.map((plugin: PluginId) => {
        const pluginHandle = pluginHandles[plugin];
        return (
          <section key={plugin}>
            {pluginHandle?.LibraryConfig && (
              <pluginHandle.LibraryConfig data={pluginData[plugin] ?? {}} />
            )}
          </section>
        );
      })}
      <section>
        <h4>{t("settings.library.info")}</h4>
        {t("settings.library.tracksCount", { totalTracks })}
      </section>
    </div>
  );
}
