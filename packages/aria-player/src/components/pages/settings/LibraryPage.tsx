import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { PluginId } from "../../../../../types/plugins";
import { useAppSelector, useAppDispatch } from "../../../app/hooks";
import {
  pluginHandles,
  selectActivePlugins,
  selectPluginData,
  selectPluginInfo
} from "../../../features/plugins/pluginsSlice";
import { selectAllTracks } from "../../../features/tracks/tracksSlice";
import { sortPlugins } from "../../../app/utils";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import {
  selectArtistDelimiter,
  setArtistDelimiter
} from "../../../features/config/configSlice";

export function LibraryPage() {
  const dispatch = useAppDispatch();

  const { t } = useTranslation();
  const { platform } = useContext(PlatformContext);
  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginData = useAppSelector(selectPluginData);
  const allTracks = useAppSelector(selectAllTracks);
  const totalTracks = allTracks.length;
  const plugins = useAppSelector(selectPluginInfo);
  const artistDelimiter = useAppSelector(selectArtistDelimiter);
  const activeSourcePlugins = activePlugins
    .filter((plugin: PluginId) =>
      plugins[plugin].capabilities?.includes("source")
    )
    .sort(sortPlugins);

  return (
    <div className={styles.page}>
      <h3 className={styles.title}>{t("settings.sections.library")}</h3>
      <p>{t("settings.library.subtitle")}</p>
      <hr className={styles.separator} />
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
          <section key={plugin} className="settings-section">
            {pluginHandle?.LibraryConfig && (
              <pluginHandle.LibraryConfig data={pluginData[plugin] ?? {}} />
            )}
          </section>
        );
      })}
      <section className="settings-section">
        <h4 className="settings-heading">
          {t("settings.library.artistDelimiter")}
        </h4>
        <input
          type="text"
          value={artistDelimiter}
          onChange={(event) => {
            dispatch(setArtistDelimiter(event.target.value));
          }}
        />
        <p>{t("settings.library.artistDelimiterDescription")}</p>
      </section>
      <section className="settings-section">
        <h4 className="settings-heading">{t("settings.library.info")}</h4>
        {t("settings.library.tracksCount", { totalTracks })}
      </section>
    </div>
  );
}
