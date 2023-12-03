import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { plugins } from "../../plugins/plugins";
import { isTauri } from "../../app/utils";
import { PluginId } from "../../features/plugins/pluginsTypes";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  pluginHandles,
  selectPluginsActive,
  selectPluginsConfig,
  setPluginActive
} from "../../features/plugins/pluginsSlice";

export function PluginsPage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const pluginsActive = useAppSelector(selectPluginsActive);
  const pluginsConfig = useAppSelector(selectPluginsConfig);

  function shouldShowPlugin(plugin: PluginId) {
    return !(plugins[plugin].needsTauri && !isTauri());
  }

  return (
    <>
      <h4 className={styles.header}>
        {t("settings.plugins.availablePlugins")}
      </h4>
      {Object.keys(plugins).map(
        (plugin, index) =>
          shouldShowPlugin(plugin) && (
            <React.Fragment key={index}>
              <input
                type="checkbox"
                readOnly
                checked={pluginsActive.includes(plugin)}
                onClick={async () => {
                  if (pluginsActive.includes(plugin)) {
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
                    setPluginActive({
                      plugin: plugin,
                      active: !pluginsActive.includes(plugin)
                    })
                  );
                }}
              />
              {plugins[plugin].name}
              <br />
            </React.Fragment>
          )
      )}
      {pluginsActive && pluginsActive.length > 0 && (
        <h4 className={styles.header}>{t("settings.plugins.pluginConfig")}</h4>
      )}
      {pluginsActive?.map((plugin: PluginId) => {
        const pluginHandle = pluginHandles[plugin];
        return (
          <React.Fragment key={plugin}>
            {pluginHandle?.Config && (
              <pluginHandle.Config config={pluginsConfig[plugin] as unknown} />
            )}
          </React.Fragment>
        );
      })}
    </>
  );
}
