import { appWindow } from "@tauri-apps/api/window";
import { useState, useCallback, useEffect } from "react";
import { WindowsControlsIcons } from "./WindowsControlIcons";
import styles from "./WindowsControls.module.css";

export function WindowsControls() {
  const [isMaximized, setIsMaximized] = useState<boolean | null>(null);

  const updateIsMaximized = useCallback(async () => {
    setIsMaximized(await appWindow.isMaximized());
  }, []);

  useEffect(() => {
    if (typeof window.__TAURI_IPC__ == "undefined") return;

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
        <WindowsControlsIcons.minimizeWin />
      </button>
      <button
        className={styles.windowsControl}
        onClick={() => {
          appWindow.toggleMaximize();
        }}
      >
        {isMaximized ? (
          <WindowsControlsIcons.maximizeRestoreWin />
        ) : (
          <WindowsControlsIcons.maximizeWin />
        )}
      </button>
      <button
        className={`${styles.windowsControl} ${styles.windowsClose}`}
        onClick={() => {
          appWindow.close();
        }}
      >
        <WindowsControlsIcons.closeWin />
      </button>
    </div>
  );
}
