import { t } from "i18next";
import type { Alert } from "../../../types/plugins";

export type DialogScope = "view" | "window";

export type ConfirmOptions = {
  heading: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
};

export type DialogState = { scope: DialogScope } & (
  | (Alert & { variant: "dialog" | "alert-dialog" })
  | (ConfirmOptions & {
      variant: "confirm";
      onResult: (confirmed: boolean) => void;
    })
);

let listener: ((state: DialogState | null) => void) | null = null;

export function setDialogListener(
  fn: ((state: DialogState | null) => void) | null
) {
  listener = fn;
}

export function showDialog(options: Alert, scope: DialogScope = "view") {
  listener?.({ ...options, variant: "dialog", scope });
}

export function showAlert(options: Alert, scope: DialogScope = "view") {
  listener?.({ ...options, variant: "alert-dialog", scope });
}

export function showConfirmation(
  message: string,
  options: {
    confirmLabel?: string;
    destructive?: boolean;
    scope?: DialogScope;
  } = {}
): Promise<boolean> {
  return new Promise((resolve) => {
    if (!listener) {
      resolve(false);
      return;
    }
    listener({
      variant: "confirm",
      scope: options.scope ?? "view",
      heading: t("confirmDialog.heading"),
      message,
      confirmLabel: options.confirmLabel ?? t("confirmDialog.confirm"),
      cancelLabel: t("confirmDialog.cancel"),
      destructive: options.destructive,
      onResult: resolve,
    });
  });
}
