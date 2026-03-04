import { useState, ChangeEvent } from "react";
import { SpotifyConfig } from "./createSpotifyPlayer";
import { SourceCallbacks } from "../../../../types/plugins";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";
import { i18n } from "i18next";
import SpotifySetupDialog from "./SpotifySetupDialog";

export default function LibraryConfig(props: {
  data: object;
  host: SourceCallbacks;
  authenticate: () => void;
  logout: () => void;
  redirectUri: string;
  i18n: i18n;
}) {
  const config = props.data as SpotifyConfig;
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [redirectUri, setRedirectUri] = useState(config.redirectUri ?? "");
  const [showSetupDialog, setShowSetupDialog] = useState(false);

  function updateRedirectUri(event: ChangeEvent<HTMLInputElement>) {
    setRedirectUri(event.target.value);
    props.host.updateData({ ...config, redirectUri: event.target.value });
  }

  function handleSetupSubmit(clientId: string) {
    props.host.updateData({ ...config, clientId });
    setShowSetupDialog(false);
    props.authenticate();
  }

  return (
    <div>
      {showSetupDialog && (
        <SpotifySetupDialog
          redirectUri={props.redirectUri}
          initialClientId={config.clientId ?? ""}
          onSubmit={handleSetupSubmit}
          onClose={() => setShowSetupDialog(false)}
          i18n={props.i18n}
        />
      )}
      <h4 className="settings-heading">{t("settings.heading")}</h4>
      {config.accessToken ? (
        <button className="settings-button" onClick={props.logout}>
          {t("settings.logOutFromSpotify")}
        </button>
      ) : (
        <button
          className={styles.loginButton}
          onClick={() => setShowSetupDialog(true)}
        >
          <SpotifyLogo className={styles.spotifyLogo} />
          {t("settings.logInWithSpotify")}
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
          {t("settings.redirectUri")}
          <br />
          <input
            type="text"
            value={redirectUri}
            onChange={updateRedirectUri}
            onKeyDown={(e) => e.stopPropagation()}
          />
        </p>
      )}
    </div>
  );
}
