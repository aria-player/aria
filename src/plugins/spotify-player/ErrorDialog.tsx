import styles from "./spotify.module.css";

export default function ErrorDialog(props: { onClose: () => void }) {
  return (
    <div className={styles.dialogOuter}>
      <div className={styles.dialogInner} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>Spotify Premium Required</h3>
        <p>
          Your Spotify account does not have an active Spotify Premium
          subscription. Spotify Premium is required for playback of tracks from
          Spotify within the app.
        </p>
        <button className="settings-button" onClick={props.onClose}>
          Log out
        </button>
      </div>
    </div>
  );
}
