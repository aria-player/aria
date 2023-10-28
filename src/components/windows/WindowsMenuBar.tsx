import { WindowsControls } from "./WindowsControls";
import styles from "./WindowsMenuBar.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { goBack, goForward } from "redux-first-history";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import RightArrow from "../../assets/arrow-right-solid.svg?react";
import { MenuButton } from "../MenuButton";
import { selectMenuState } from "../../app/menu";

export function WindowsMenuBar() {
  const dispatch = useAppDispatch();
  const menuState = useAppSelector(selectMenuState);
  const backEnabled = !menuState["menubar_navigate_back"]?.disabled;
  const forwardEnabled = !menuState["menubar_navigate_forward"]?.disabled;

  return (
    <div className={styles.menuBar}>
      <div className={styles.navigation}>
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
      <div className={styles.dragRegion} data-tauri-drag-region></div>
      <WindowsControls />
    </div>
  );
}
