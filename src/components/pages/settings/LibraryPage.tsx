import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { plugins } from "../../../plugins/plugins";
import { PluginId } from "../../../features/plugins/pluginsTypes";
import React from "react";
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
    <>
      {activeSourcePlugins.length == 0 ? (
        <>
          <h4>{t("settings.library.noSources")}</h4>
          <i className={styles.header}>
            {t("settings.library.noSourcesDetail")}
          </i>
        </>
      ) : (
        <>
          <h4>{"Library info"}</h4>
          {scannedTracks == totalTracks ? (
            `Total tracks in library: ${totalTracks}`
          ) : (
            <>
              Scanning in progress ({scannedTracks}/{totalTracks}) <br />
              <progress value={scannedTracks} max={totalTracks} />
            </>
          )}
        </>
      )}
      {activePlugins?.map((plugin: PluginId) => {
        const pluginHandle = pluginHandles[plugin];
        if (plugins[plugin].type != "source") return null;

        return (
          <React.Fragment key={plugin}>
            <h4 className={styles.header}>
              {t("settings.library.managePlugin", {
                plugin: plugins[plugin].name
              })}
            </h4>
            {pluginHandle?.Config && (
              <pluginHandle.Config data={pluginData[plugin] ?? {}} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
