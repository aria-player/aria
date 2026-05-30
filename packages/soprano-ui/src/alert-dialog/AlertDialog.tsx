import React from "react";
import { DialogRoot, DialogBackdrop } from "../dialog/Dialog";
import {
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "../dialog/primitives";
import styles from "../dialog/Dialog.module.css";

export interface AlertDialogProps {
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  cancelLabel?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AlertDialog({
  trigger,
  title,
  description,
  children,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
  open,
  onOpenChange,
}: AlertDialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogBackdrop role="alertdialog" dismissable={false}>
        <div className={styles.panel}>
          <DialogTitle className={styles.title}>{title}</DialogTitle>
          {description && (
            <DialogDescription className={styles.description}>
              {description}
            </DialogDescription>
          )}
          {children}
          <div className={styles.actions}>
            {cancelLabel && (
              <DialogClose asChild>
                <button onClick={onCancel}>{cancelLabel}</button>
              </DialogClose>
            )}
            {confirmLabel && (
              <DialogClose asChild>
                <button onClick={onConfirm}>{confirmLabel}</button>
              </DialogClose>
            )}
          </div>
        </div>
      </DialogBackdrop>
    </DialogRoot>
  );
}
