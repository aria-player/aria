import { useEffect, useState } from "react";
import { setAlertListener } from "../../../features/plugins/pluginsAlerts";
import styles from "./PluginAlertDialog.module.css";
import { Alert } from "../../../../../types/plugins";

export default function PluginAlertDialog() {
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
        {typeof alert?.message === "string" ? (
          <p>{alert.message}</p>
        ) : (
          alert?.message && <alert.message />
        )}
        <button
          className={`settings-button ${styles.closeButton}`}
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
