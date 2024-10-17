import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { isTauri, sortDefaultPluginsFirst } from "../../../app/utils";
import { PluginId } from "../../../features/plugins/pluginsTypes";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  installPluginsFromFiles,
  pluginHandles,
  selectActivePlugins,
  selectEnabledPlugins,
  selectPluginData,
  selectPluginInfo,
  setPluginEnabled,
  uninstallPlugin
} from "../../../features/plugins/pluginsSlice";
import { defaultPluginInfo } from "../../../plugins/plugins";
import RemoveIcon from "../../../assets/trash-can-solid.svg?react";

export function PluginsPage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const enabledPlugins = useAppSelector(selectEnabledPlugins);
  const activePlugins = useAppSelector(selectActivePlugins);
  const plugins = useAppSelector(selectPluginInfo);
  const pluginData = useAppSelector(selectPluginData);

  function shouldShowPlugin(plugin: PluginId) {
    return !(plugins[plugin].needsTauri && !isTauri());
  }

  const showPluginFilePicker = async () => {
    try {
      const fileHandles = await window.showOpenFilePicker({
        types: [
          {
            accept: {
              "application/zip": [".zip"]
            }
          }
        ],
        multiple: true
      });
      dispatch(installPluginsFromFiles(fileHandles));
    } catch (error) {
      console.error("Error installing plugin:", error);
    }
  };

  const configurablePlugins = activePlugins
    .filter((plugin: PluginId) => pluginHandles[plugin]?.Config)
    .sort(sortDefaultPluginsFirst);

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.plugins")}</h3>
      <p>{t("settings.plugins.subtitle")}</p>
      <hr />
      <section>
        <h4>{t("settings.plugins.availablePlugins")}</h4>
        {Object.keys(plugins)
          .filter(
            (plugin) =>
              !Object.keys(defaultPluginInfo).includes(plugin) ||
              import.meta.env.VITE_ALLOW_MANAGING_DEFAULT_PLUGINS == "true"
          )
          .map(
            (plugin, index) =>
              shouldShowPlugin(plugin) && (
                <React.Fragment key={index}>
                  <div className={styles.plugin}>
                    <input
                      type="checkbox"
                      readOnly
                      checked={enabledPlugins.includes(plugin)}
                      onClick={async () => {
                        if (enabledPlugins.includes(plugin)) {
                          const confirmed = await confirm(
                            t("settings.plugins.confirmDisable", {
                              plugin: plugins[plugin].name
                            })
                          );
                          if (!confirmed) {
                            return;
                          }
                        }
                        dispatch(
                          setPluginEnabled({
                            plugin: plugin,
                            enabled: !enabledPlugins.includes(plugin)
                          })
                        );
                      }}
                    />
                    {plugins[plugin].name}
                    {!Object.keys(defaultPluginInfo).includes(plugin) && (
                      <button
                        onClick={async () => {
                          const confirmed = await confirm(
                            t("settings.plugins.confirmUninstall", {
                              plugin: plugins[plugin].name
                            })
                          );
                          if (!confirmed) return;
                          dispatch(uninstallPlugin(plugin));
                        }}
                        className={styles.removeButton}
                        title={t("settings.plugins.uninstall")}
                      >
                        <RemoveIcon />
                      </button>
                    )}
                  </div>
                </React.Fragment>
              )
          )}
        <p>
          <i>{t("settings.plugins.configureSources")}</i>
        </p>
        <p>
          <button onClick={showPluginFilePicker}>
            {t("settings.plugins.installFromFile")}
          </button>
        </p>
      </section>
      <section>
        {configurablePlugins.length > 0 && (
          <h4>{t("settings.plugins.pluginConfig")}</h4>
        )}
        {configurablePlugins?.map((plugin: PluginId) => {
          const pluginHandle = pluginHandles[plugin];
          return (
            <React.Fragment key={plugin}>
              {pluginHandle?.Config && (
                <pluginHandle.Config data={pluginData[plugin] ?? {}} />
              )}
            </React.Fragment>
          );
        })}
      </section>
    </div>
  );
}
