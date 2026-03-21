import { WindowsControls } from "./WindowsControls";
import styles from "./WindowsMenuBar.module.css";
import { MenuButton } from "./MenuButton";
import { WindowsMenuBarButtons } from "./WindowsMenuBarButtons";
import { useContext } from "react";
import { PlatformContext } from "../../../contexts/PlatformContext";
import AppIcon from "../../../../app-icon.svg?react";

export function WindowsMenuBar() {
  const { fullscreen, decorations } = useContext(PlatformContext);

  return (
    <div
      className={`windows-menu-bar ${styles.menuBar} ${
        decorations ? `${styles.menuBarSmall}` : ""
      }`}
    >
      {!decorations && (
        <AppIcon className={styles.appIcon} data-tauri-drag-region />
      )}
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
