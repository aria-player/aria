import SpotifyLogo from "./assets/spotify-brands-solid.svg?react";
import styles from "./spotify.module.css";

export default function QuickStart(props: { authenticate: () => void }) {
  return (
    <div className={styles.quickStart}>
      <button
        style={{
          background: "#1DB954",
          border: "none",
          padding: "0.5rem 1.25rem"
        }}
        className={styles.loginButton}
        onClick={props.authenticate}
      >
        <SpotifyLogo className={styles.spotifyLogo} />
        Log in with Spotify
      </button>
    </div>
  );
}
