import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectCurrentAlert,
  setCurrentAlert
} from "../../../features/plugins/pluginsSlice";
import styles from "./PluginAlertDialog.module.css";

export default function ErrorDialog() {
  const dispatch = useAppDispatch();
  const alert = useAppSelector(selectCurrentAlert);
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
            dispatch(setCurrentAlert(null));
            alert?.onClose?.();
          }}
        >
          {alert?.closeLabel}
        </button>
      </div>
    </div>
  );
}
