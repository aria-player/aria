import { useTranslation } from "react-i18next";
import { i18n } from "i18next";
import { IntegrationCallbacks } from "../../../../types";
import { getEnabledSources, STREAMING_SOURCES, type LastfmData } from "./api";
import LastfmLogo from "./assets/lastfm-brands-solid-full.svg?react";
import styles from "./lastfm.module.css";

export default function LastfmConfig(props: {
  data: object;
  host: IntegrationCallbacks;
  authenticate: () => void;
  logout: () => void;
  i18n: i18n;
}) {
  const config = props.data as LastfmData;
  const { t } = useTranslation("lastfm-integration", { i18n: props.i18n });

  const setSourceEnabled = (source: string, enabled: boolean) => {
    const enabledSources = new Set(getEnabledSources(config));
    if (enabled) enabledSources.add(source);
    else enabledSources.delete(source);
    props.host.updateData({ ...config, enabledSources: [...enabledSources] });
  };

  return (
    <div>
      {config.sessionKey ? (
        <>
          <div className={styles.connected}>
            <div className={styles.connectedRow}>
              <LastfmLogo className={styles.connectedLogo} />
              {t("settings.connected", { username: config.username })}
            </div>
            <button className="settings-button" onClick={props.logout}>
              {t("settings.disconnectButton")}
            </button>
          </div>
          <div className={styles.sources}>
            <h4 className={styles.sourcesHeading}>
              {t("settings.sourcesHeading")}
            </h4>
            {STREAMING_SOURCES.map((source) => {
              const name = props.host.getSourceDisplayName(source);
              if (!name) return null;
              return (
                <label key={source} className={styles.sourceToggle}>
                  <input
                    type="checkbox"
                    checked={getEnabledSources(config).includes(source)}
                    onChange={(event) =>
                      setSourceEnabled(source, event.target.checked)
                    }
                  />
                  {name}
                </label>
              );
            })}
            <p className={styles.sourcesNote}>{t("settings.sourcesNote")}</p>
          </div>
        </>
      ) : (
        <button className={styles.connectButton} onClick={props.authenticate}>
          <LastfmLogo className={styles.connectLogo} />
          {t("settings.connectButton")}
        </button>
      )}
    </div>
  );
}
