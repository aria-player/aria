import { WindowsControls } from "./WindowsControls";
import styles from "./WindowsMenuBar.module.css";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { goBack, goForward } from "redux-first-history";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import RightArrow from "../../assets/arrow-right-solid.svg?react";
import { useEffect, useState } from "react";
import { MenuButton } from "../MenuButton";

export function WindowsMenuBar() {
  const dispatch = useAppDispatch();
  const history = useAppSelector((state) => state.router);
  const [backEnabled, setBackEnabled] = useState(false);
  const [forwardEnabled, setForwardEnabled] = useState(false);

  useEffect(() => {
    setBackEnabled(window.history.length > 1 && window.history.state.idx > 0);
    setForwardEnabled(
      window.history.length > 1 &&
        window.history.length - 1 != window.history.state.idx
    );
  }, [history]);

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
