import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { plugins } from "../../../plugins/plugins";
import { PluginId } from "../../../features/plugins/pluginsTypes";
import { useAppSelector } from "../../../app/hooks";
import {
  pluginHandles,
  selectActivePlugins,
  selectPluginData
} from "../../../features/plugins/pluginsSlice";
import { selectAllTracks } from "../../../features/tracks/tracksSlice";

export function LibraryPage() {
  const { t } = useTranslation();
  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginData = useAppSelector(selectPluginData);
  const allTracks = useAppSelector(selectAllTracks);
  const scannedTracks = allTracks.filter(
    (track) => track.metadataLoaded
  ).length;
  const totalTracks = allTracks.length;
  const activeSourcePlugins = activePlugins.filter(
    (plugin: PluginId) => plugins[plugin].type === "source"
  );

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.library")}</h3>
      <p>{t("settings.library.subtitle")}</p>
      <hr />
      {activeSourcePlugins.length == 0 && (
        <div className={styles.alert}>
          <i>{t("settings.library.noSources")}</i>
        </div>
      )}
      {activePlugins?.map((plugin: PluginId) => {
        const pluginHandle = pluginHandles[plugin];
        if (plugins[plugin].type != "source") return null;

        return (
          <section key={plugin}>
            {pluginHandle?.Config && (
              <pluginHandle.Config data={pluginData[plugin] ?? {}} />
            )}
          </section>
        );
      })}
      <section>
        <h4>{t("settings.library.info")}</h4>
        {scannedTracks == totalTracks ? (
          t("settings.library.tracksCount", {
            totalTracks
          })
        ) : (
          <>
            {t("settings.library.scanProgress", {
              scannedTracks,
              totalTracks
            })}
            <br />
            <progress value={scannedTracks} max={totalTracks} />
          </>
        )}
      </section>
    </div>
  );
}
