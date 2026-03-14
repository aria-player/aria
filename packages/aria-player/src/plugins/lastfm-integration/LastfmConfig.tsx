import { useTranslation } from "react-i18next";
import { i18n } from "i18next";
import { IntegrationCallbacks } from "../../../../types";
import type { LastfmData } from "./api";
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

  return (
    <div>
      {config.sessionKey ? (
        <div className={styles.connected}>
          <div className={styles.connectedRow}>
            <LastfmLogo className={styles.connectedLogo} />
            {t("settings.connected", { username: config.username })}
          </div>
          <button className="settings-button" onClick={props.logout}>
            {t("settings.disconnectButton")}
          </button>
        </div>
      ) : (
        <button className={styles.connectButton} onClick={props.authenticate}>
          <LastfmLogo className={styles.connectLogo} />
          {t("settings.connectButton")}
        </button>
      )}
    </div>
  );
}
