import { WindowsControls } from "./WindowsControls";
import styles from "./WindowsMenuBar.module.css";
import { MenuButton } from "../../appmenu/MenuButton";
import { WindowsMenuBarButtons } from "./WindowsMenuBarButtons";
import { useContext } from "react";
import { PlatformContext } from "../../../contexts/PlatformContext";

export function WindowsMenuBar() {
  const { fullscreen, decorations } = useContext(PlatformContext);

  return (
    <div
      className={`windows-menu-bar ${styles.menuBar} ${
        decorations ? `${styles.menuBarSmall}` : ""
      }`}
    >
      <div className={styles.navigationShort}>
        <MenuButton />
      </div>
      <div className={styles.navigationLong}>
        <WindowsMenuBarButtons />
      </div>
      {fullscreen === false && decorations === false && (
        <div className={styles.dragRegion} data-tauri-drag-region></div>
      )}
      {fullscreen === false && decorations === false && <WindowsControls />}
    </div>
  );
}
