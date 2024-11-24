import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";

export default function QuickStart(props: { authenticate: () => void }) {
  return (
    <div className={styles.quickStart}>
      <button className={styles.loginButton} onClick={props.authenticate}>
        <SpotifyLogo className={styles.spotifyLogo} />
        Log in with Spotify
      </button>
    </div>
  );
}
