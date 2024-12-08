import styles from "./applemusic.module.css";

export default function QuickStart(props: { authenticate: () => void }) {
  return (
    <button className={styles.loginButton} onClick={props.authenticate}>
      Log in with Apple Music
    </button>
  );
}
