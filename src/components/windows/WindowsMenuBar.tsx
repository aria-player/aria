import { WindowsControls } from "./WindowsControls";
import styles from "./WindowsMenuBar.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { goBack, goForward } from "redux-first-history";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import RightArrow from "../../assets/arrow-right-solid.svg?react";
import { MenuButton } from "../MenuButton";
import { selectMenuState } from "../../app/menu";
import { WindowsMenuBarButtons } from "./WindowsMenuBarButtons";
import { useContext } from "react";
import { PlatformContext } from "../../contexts/PlatformContext";

export function WindowsMenuBar() {
  const { fullscreen } = useContext(PlatformContext);

  const dispatch = useAppDispatch();
  const menuState = useAppSelector(selectMenuState);
  const backEnabled = !menuState.back?.disabled;
  const forwardEnabled = !menuState.forward?.disabled;

  return (
    <div className={styles.menuBar}>
      <div className={styles.navigationShort}>
        <MenuButton />
        <LeftArrow
          title="Back"
          className={`${styles.arrow} ${
            backEnabled ? "" : `${styles.arrowDisabled}`
          }`}
          onClick={() => {
            if (backEnabled) dispatch(goBack());
          }}
        />
        <RightArrow
          title="Forward"
          className={`${styles.arrow} ${
            forwardEnabled ? "" : `${styles.arrowDisabled}`
          }`}
          onClick={() => {
            if (forwardEnabled) dispatch(goForward());
          }}
        />
      </div>
      <div className={styles.navigationLong}>
        <WindowsMenuBarButtons />
      </div>
      {fullscreen === false && (
        <div className={styles.dragRegion} data-tauri-drag-region></div>
      )}
      {fullscreen === false && <WindowsControls />}
    </div>
  );
}
