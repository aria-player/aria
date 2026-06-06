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

  const description =
    state && typeof state.message === "string" ? state.message : undefined;
  const Message =
    state && typeof state.message !== "string" ? state.message : null;

  if (state?.variant === "dialog") {
    return (
      <Dialog
        open
        onOpenChange={(open) => !open && handleClose()}
        title={state.heading}
        description={description}
        actions={[{ label: state.closeLabel, onClick: handleClose }]}
      >
        {Message && <Message />}
      </Dialog>
    );
  }

  return (
    <AlertDialog
      open={!!state}
      onOpenChange={(open) => !open && handleClose()}
      title={state?.heading ?? ""}
      description={description}
      confirmLabel={state?.closeLabel}
      onConfirm={handleClose}
    >
      {Message && <Message />}
    </AlertDialog>
  );
}
