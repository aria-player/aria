import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useState, useCallback, useEffect } from "react";
import { isTauri } from "../../../app/utils";

import Minimize from "../../../assets/win-minimize.svg?react";
import Maximize from "../../../assets/win-maximize.svg?react";
import Restore from "../../../assets/win-restore.svg?react";
import Close from "../../../assets/win-close.svg?react";

import styles from "./WindowsControls.module.css";
import { invoke } from "@tauri-apps/api/core";

const appWindow = getCurrentWebviewWindow();

export function WindowsControls() {
  const [isMaximized, setIsMaximized] = useState<boolean | null>(null);

  const updateIsMaximized = useCallback(async () => {
    setIsMaximized(await appWindow.isMaximized());
  }, []);

  useEffect(() => {
    if (!isTauri()) return;

    updateIsMaximized();

    let unsubscribe: (() => void) | undefined = undefined;

    const subscribeToWindowChanges = async () => {
      unsubscribe = await appWindow.onResized(() => {
        updateIsMaximized();
      });
    };
    subscribeToWindowChanges();

    return () => unsubscribe && unsubscribe();
  }, [updateIsMaximized]);

  return (
    <div className={styles.windowsControls}>
      <button
        className={styles.windowsControl}
        onClick={() => {
          appWindow.minimize();
        }}
      >
        <Minimize />
      </button>
      <button
        className={styles.windowsControl}
        onClick={() => {
          appWindow.toggleMaximize();
        }}
      >
        {isMaximized ? <Restore /> : <Maximize />}
      </button>
      <button
        className={`${styles.windowsControl} ${styles.windowsClose}`}
        onClick={() => {
          invoke("close");
        }}
      >
        <Close />
      </button>
    </div>
  );
}
