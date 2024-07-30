import { useContext, useState } from "react";
import { PlatformContext, Platform } from "../../contexts/PlatformContext";
import { MacTitleBar } from "../platforms/mac/MacTitleBar";
import { WindowsMenuBar } from "../platforms/windows/WindowsMenuBar";
import styles from "./CrashPage.module.css";

export const CrashPage = ({ error }: { error: DOMException }) => {
  const { platform, fullscreen } = useContext(PlatformContext);
  const [showDetails, setShowDetails] = useState(false);
  const contextError = platform == Platform.Unknown;
  const tauriDragRegion = contextError
    ? { "data-tauri-drag-region": true }
    : {};

  return (
    <div className={styles.window} {...tauriDragRegion}>
      {platform == Platform.Mac && fullscreen === false && <MacTitleBar />}
      {platform == Platform.Windows && <WindowsMenuBar />}
      <div className={styles.error} {...tauriDragRegion}>
        <h1 {...tauriDragRegion}>
          Something went {contextError && "catastrophically "}
          wrong
        </h1>
        <p {...tauriDragRegion}>Error message: &quot;{error.message}&quot;</p>
        <div className={styles.details} {...tauriDragRegion}>
          <button
            onClick={() => {
              setShowDetails(!showDetails);
            }}
          >
            {showDetails ? "Hide error details" : "Show error details"}
          </button>
          <div
            className={styles.collapsible}
            style={{ display: showDetails ? "block" : "none" }}
          >
            <pre>{error.stack}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
