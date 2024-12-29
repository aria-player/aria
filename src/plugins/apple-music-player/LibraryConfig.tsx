import { useState, ChangeEvent } from "react";
import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { AppleMusicConfig } from "./createAppleMusicPlayer";
import styles from "./applemusic.module.css";
import { useTranslation } from "react-i18next";
import { i18n } from "i18next";

export default function LibraryConfig(props: {
  data: object;
  host: SourceCallbacks;
  authenticate: () => void;
  logout: () => void;
  i18n: i18n;
}) {
  const config = props.data as AppleMusicConfig;
  const { t } = useTranslation("apple-music-player", { i18n: props.i18n });

  const [developerToken, setDeveloperToken] = useState(
    config.developerToken ?? ""
  );
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  function updateDeveloperToken(event: ChangeEvent<HTMLInputElement>) {
    setDeveloperToken(event.target.value);
    props.host.updateData({ ...config, developerToken: event.target.value });
  }

  return (
    <div>
      <h3 className="settings-heading">{t("settings.heading")}</h3>
      {!config.loggedIn ? (
        <button className={styles.loginButton} onClick={props.authenticate}>
          {t("settings.logInWithAppleMusic")}
        </button>
      ) : (
        <button className="settings-button" onClick={props.logout}>
          {t("settings.logOutFromAppleMusic")}
        </button>
      )}
      <p>
        <button
          className={styles.advancedSettingsButton}
          onClick={() => {
            setShowAdvancedSettings(!showAdvancedSettings);
          }}
        >
          {t("settings.toggleAdvancedSettings")}
        </button>
      </p>
      {showAdvancedSettings && (
        <p>
          {t("settings.developerToken")}
          <br />
          <input
            type="text"
            value={developerToken}
            onChange={updateDeveloperToken}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </p>
      )}
    </div>
  );
}
