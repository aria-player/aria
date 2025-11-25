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
import { selectLibraryTracks } from "../../../features/tracks/tracksSlice";
import { sortPlugins } from "../../../app/utils";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import {
  selectArtistDelimiterType,
  selectCustomArtistDelimiter,
  setArtistDelimiterType,
  setCustomArtistDelimiter
} from "../../../features/config/configSlice";
import { ArtistDelimiterType } from "../../../features/artists/artistsTypes";

export function LibraryPage() {
  const dispatch = useAppDispatch();

  const { t } = useTranslation();
  const { platform } = useContext(PlatformContext);
  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginData = useAppSelector(selectPluginData);
  const libraryTracks = useAppSelector(selectLibraryTracks);
  const totalTracks = libraryTracks.length;
  const plugins = useAppSelector(selectPluginInfo);
  const artistDelimiterType = useAppSelector(selectArtistDelimiterType);
  const customArtistDelimiter = useAppSelector(selectCustomArtistDelimiter);
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
        <select
          className="settings-select"
          value={artistDelimiterType}
          onChange={(e) => {
            dispatch(
              setArtistDelimiterType(e.target.value as ArtistDelimiterType)
            );
          }}
        >
          <option value="">
            {`${t("settings.library.delimiterOptions.none")} ${t("settings.default")}`}
          </option>
          <option value="/">
            {t("settings.library.delimiterOptions.slash")}
          </option>
          <option value=";">
            {t("settings.library.delimiterOptions.semicolon")}
          </option>
          <option value=",">
            {t("settings.library.delimiterOptions.comma")}
          </option>
          <option value="&">
            {t("settings.library.delimiterOptions.ampersand")}
          </option>
          <option value=" / ">
            {t("settings.library.delimiterOptions.spacedSlash")}
          </option>
          <option value="custom">
            {t("settings.library.delimiterOptions.custom")}
          </option>
        </select>
        {artistDelimiterType == ArtistDelimiterType.Custom && (
          <input
            type="text"
            className={styles.customDelimiterInput}
            value={customArtistDelimiter}
            onChange={(e) => dispatch(setCustomArtistDelimiter(e.target.value))}
            placeholder={t("settings.library.customDelimiterPlaceholder")}
          />
        )}
        <p>{t("settings.library.artistDelimiterDescription")}</p>
      </section>
      <section className="settings-section">
        <h4 className="settings-heading">{t("settings.library.info")}</h4>
        {t("settings.library.tracksCount", { totalTracks })}
      </section>
    </div>
  );
}
