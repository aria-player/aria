import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertDialog, Dialog } from "soprano-ui";
import { setDialogListener, type DialogState } from "../../../app/dialogs";

export default function PluginDialog({
  region,
}: {
  region?: HTMLElement | null;
}) {
  const [state, setState] = useState<DialogState | null>(null);

  useEffect(() => {
    setDialogListener(setState);
    return () => setDialogListener(null);
  }, []);

  function renderDialog() {
    if (state?.variant === "confirm") {
      const resolve = (confirmed: boolean) => {
        state.onResult(confirmed);
        setState(null);
      };
      return (
        <Dialog
          open
          onOpenChange={(open) => !open && resolve(false)}
          title={state.heading}
          description={state.message}
          actions={[
            { label: state.cancelLabel, onClick: () => resolve(false) },
            {
              label: state.confirmLabel,
              onClick: () => resolve(true),
              variant: state.destructive ? "destructive" : undefined,
            },
          ]}
        />
      );
    }

    const handleClose = () => {
      state?.onClose?.();
      setState(null);
    };

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
        title={state?.variant === "alert-dialog" ? state.heading : ""}
        description={description}
        confirmLabel={
          state?.variant === "alert-dialog" ? state.closeLabel : undefined
        }
        onConfirm={handleClose}
      >
        {Message && <Message />}
      </AlertDialog>
    );
  }

  const dialog = renderDialog();
  if (state?.scope === "window" && region) {
    return createPortal(dialog, region);
  }
  return dialog;
}
