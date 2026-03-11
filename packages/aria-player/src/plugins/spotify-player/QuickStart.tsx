import { i18n } from "i18next";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { SpotifyConfig } from "./createSpotifyPlayer";
import SpotifySetupDialog from "./SpotifySetupDialog";

export default function QuickStart(props: {
  authenticate: (showLibrarySetupDialog?: boolean) => void;
  config: SpotifyConfig;
  redirectUri: string;
  updateData: (data: SpotifyConfig) => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });
  const [showSetupDialog, setShowSetupDialog] = useState(false);

  if (props.config.accessToken) {
    return null;
  }

  function handleSetupSubmit(clientId: string) {
    props.updateData({ ...props.config, clientId });
    setShowSetupDialog(false);
    props.authenticate(true);
  }

  return (
    <div className={styles.quickStart}>
      {showSetupDialog && (
        <SpotifySetupDialog
          redirectUri={props.redirectUri}
          initialClientId={props.config.clientId ?? import.meta.env.VITE_SPOTIFY_CLIENT_ID ?? ""}
          onSubmit={handleSetupSubmit}
          onClose={() => setShowSetupDialog(false)}
          i18n={props.i18n}
        />
      )}
      <button
        className={styles.loginButton}
        onClick={() => setShowSetupDialog(true)}
      >
        <SpotifyLogo className={styles.spotifyLogo} />
        {t("settings.logInWithSpotify")}
      </button>
    </div>
  );
}
