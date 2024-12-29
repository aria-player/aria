import { useEffect, useState } from "react";
import { setAlertListener } from "../../../features/plugins/pluginsAlerts";
import styles from "./PluginAlertDialog.module.css";
import { Alert } from "../../../features/plugins/pluginsTypes";

export default function ErrorDialog() {
  const [alert, setAlert] = useState<Alert | null>(null);

  useEffect(() => {
    setAlertListener((alert) => {
      setAlert(alert);
    });
    return () => {
      setAlertListener(null);
    };
  }, []);

  if (!alert) return;

  return (
    <div className={styles.dialogOuter}>
      <div className={styles.dialogInner} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>{alert?.heading}</h3>
        <p>
          {typeof alert?.message === "string"
            ? alert.message
            : alert?.message && <alert.message />}
        </p>
        <button
          className="settings-button"
          onClick={() => {
            alert?.onClose?.();
            setAlert(null);
          }}
        >
          {alert?.closeLabel}
        </button>
      </div>
    </div>
  );
}
