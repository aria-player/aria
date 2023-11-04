import styles from "./MacTitleBar.module.css";

export function MacTitleBar() {
  return <div className={styles.menuBar} data-tauri-drag-region />;
}
