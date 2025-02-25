import { Alert } from "../../../../types/plugins";

let alertListener: ((alert: Alert | null) => void) | null;

export function showAlert(alert: Alert) {
  alertListener?.(alert);
}

export function setAlertListener(
  listener: ((alert: Alert | null) => void) | null
) {
  alertListener = listener;
}
