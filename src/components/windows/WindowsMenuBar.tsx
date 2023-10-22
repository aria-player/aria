import { WindowsControls } from "./WindowsControls";
import styles from "./WindowsMenuBar.module.css";

export function WindowsMenuBar() {
  return (
    <div className={styles.menuBar}>
      <div className={styles.dragRegion} data-tauri-drag-region></div>
      <WindowsControls />
    </div>
  );
}
