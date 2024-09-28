import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import { plugins } from "../../../plugins/plugins";
import { isTauri } from "../../../app/utils";
import { PluginId } from "../../../features/plugins/pluginsTypes";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  pluginHandles,
  selectActivePlugins,
  selectEnabledPlugins,
  selectPluginData,
  setPluginEnabled
} from "../../../features/plugins/pluginsSlice";

export function PluginsPage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const enabledPlugins = useAppSelector(selectEnabledPlugins);
  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginData = useAppSelector(selectPluginData);

  function shouldShowPlugin(plugin: PluginId) {
    return !(plugins[plugin].needsTauri && !isTauri());
  }

  const configurablePlugins = activePlugins.filter(
    (plugin: PluginId) =>
      plugins[plugin].type != "source" && pluginHandles[plugin]?.Config
  );

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.plugins")}</h3>
      <p>{t("settings.plugins.subtitle")}</p>
      <hr />
      <section>
        <h4>{t("settings.plugins.availablePlugins")}</h4>
        {Object.keys(plugins).map(
          (plugin, index) =>
            shouldShowPlugin(plugin) && (
              <React.Fragment key={index}>
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
                <br />
              </React.Fragment>
            )
        )}
        <p>
          <i>{t("settings.plugins.configureSources")}</i>
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
