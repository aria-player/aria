import { i18n } from "i18next";
import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";

export default function QuickStart(props: {
  authenticate: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });

  return (
    <div className={styles.quickStart}>
      <button className={styles.loginButton} onClick={props.authenticate}>
        <SpotifyLogo className={styles.spotifyLogo} />
        {t("settings.logInWithSpotify")}
      </button>
    </div>
  );
}
