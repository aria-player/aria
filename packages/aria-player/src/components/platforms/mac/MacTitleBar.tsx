import styles from "./MacTitleBar.module.css";

export function MacTitleBar() {
  return (
    <div className={`mac-title-bar ${styles.menuBar}`} data-tauri-drag-region />
  );
}
