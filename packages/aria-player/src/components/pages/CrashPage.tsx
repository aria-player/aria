import { useContext, useState } from "react";
import { PlatformContext, Platform } from "../../contexts/PlatformContext";
import { MacTitleBar } from "../platforms/mac/MacTitleBar";
import { WindowsMenuBar } from "../platforms/windows/WindowsMenuBar";
import styles from "./CrashPage.module.css";
import { useTranslation } from "react-i18next";
import type { FallbackProps } from "react-error-boundary";

export const CrashPage = ({ error }: FallbackProps) => {
  const { platform, fullscreen } = useContext(PlatformContext);
  const { t } = useTranslation();
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
          {t(
            contextError ? "crash.headingAlt" : "crash.heading",
            "Something went catastrophically wrong"
          )}
        </h1>
        <p {...tauriDragRegion}>
          {t("crash.errorMessage", 'Error message: "{{error}}"', {
            error: error instanceof Error ? error.message : String(error)
          })}
        </p>
        <div className={styles.details} {...tauriDragRegion}>
          <button
            onClick={() => {
              setShowDetails(!showDetails);
            }}
          >
            {showDetails
              ? t("crash.hideErrorDetails", "Hide error details")
              : t("crash.showErrorDetails", "Show error details")}
          </button>
          <div
            className={styles.collapsible}
            style={{ display: showDetails ? "block" : "none" }}
          >
            <pre>{error instanceof Error ? error.stack : undefined}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
