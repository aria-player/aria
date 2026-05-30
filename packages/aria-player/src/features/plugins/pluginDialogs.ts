import type { Alert } from "../../../../types/plugins";

export type PluginDialogState = Alert & {
  variant: "dialog" | "alert-dialog";
};

let listener: ((state: PluginDialogState | null) => void) | null = null;

export function showPluginAlert(alert: Alert) {
  listener?.({ ...alert, variant: "alert-dialog" });
}

export function showPluginDialog(alert: Alert) {
  listener?.({ ...alert, variant: "dialog" });
}

export function setPluginDialogListener(
  fn: ((state: PluginDialogState | null) => void) | null
) {
  listener = fn;
}
