import { useEffect, useState } from "react";
import { AlertDialog, Dialog } from "soprano-ui";
import {
  setPluginDialogListener,
  type PluginDialogState,
} from "../../../features/plugins/pluginDialogs";

export default function PluginDialog() {
  const [state, setState] = useState<PluginDialogState | null>(null);

  useEffect(() => {
    setPluginDialogListener(setState);
    return () => setPluginDialogListener(null);
  }, []);

  function handleClose() {
    state?.onClose?.();
    setState(null);
  }

  const body =
    typeof state?.message === "string" ? (
      <p style={{ margin: 0 }}>{state.message}</p>
    ) : (
      state?.message && <state.message />
    );

  if (state?.variant === "dialog") {
    return (
      <Dialog
        open
        onOpenChange={(open) => !open && handleClose()}
        title={state.heading}
        actions={[{ label: state.closeLabel, onClick: handleClose }]}
      >
        {body}
      </Dialog>
    );
  }

  return (
    <AlertDialog
      open={!!state}
      onOpenChange={(open) => !open && handleClose()}
      title={state?.heading ?? ""}
      confirmLabel={state?.closeLabel}
      onConfirm={handleClose}
    >
      {body}
    </AlertDialog>
  );
}
