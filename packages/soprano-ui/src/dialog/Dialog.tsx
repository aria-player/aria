import React from "react";
import { Dialog as Primitive } from "radix-ui";
import {
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogTrigger,
} from "./primitives";
import styles from "./Dialog.module.css";

const joinClasses = (...classes: (string | false | undefined)[]) =>
  classes.filter(Boolean).join(" ");

const DialogCloseContext = React.createContext<
  ((open: boolean) => void) | undefined
>(undefined);

export interface DialogRootProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function DialogRoot({ open, onOpenChange, children }: DialogRootProps) {
  return (
    <DialogCloseContext.Provider value={onOpenChange}>
      <Primitive.Root open={open} onOpenChange={onOpenChange} modal={false}>
        {children}
      </Primitive.Root>
    </DialogCloseContext.Provider>
  );
}

export interface DialogBackdropProps extends React.ComponentPropsWithoutRef<
  typeof Primitive.Content
> {
  dismissable?: boolean;
}

function useScopedFocus(backdrop: HTMLElement | null) {
  React.useEffect(() => {
    if (!backdrop) return;
    const root = backdrop.closest("main") ?? backdrop.parentElement;
    if (!root) return;

    const onPath: HTMLElement[] = [];
    for (
      let node: HTMLElement | null = backdrop;
      node && node !== root && node.parentElement;
      node = node.parentElement
    ) {
      onPath.push(node);
    }

    const inerted = new Set<HTMLElement>();
    const inertSiblings = () => {
      for (const node of onPath) {
        for (const sibling of node.parentElement?.children ?? []) {
          if (
            sibling !== node &&
            sibling instanceof HTMLElement &&
            !sibling.hasAttribute("inert")
          ) {
            sibling.setAttribute("inert", "");
            inerted.add(sibling);
          }
        }
      }
    };
    inertSiblings();

    const observers = onPath.map((node) => {
      const observer = new MutationObserver(inertSiblings);
      if (node.parentElement) {
        observer.observe(node.parentElement, { childList: true });
      }
      return observer;
    });

    return () => {
      for (const observer of observers) observer.disconnect();
      for (const sibling of inerted) sibling.removeAttribute("inert");
    };
  }, [backdrop]);
}

export function DialogBackdrop({
  dismissable = true,
  className,
  onClick,
  children,
  ...props
}: DialogBackdropProps) {
  const onOpenChange = React.useContext(DialogCloseContext);
  const [backdrop, setBackdrop] = React.useState<HTMLElement | null>(null);
  useScopedFocus(backdrop);
  return (
    <Primitive.Content
      {...props}
      ref={setBackdrop}
      className={joinClasses(styles.backdrop, className)}
      onPointerDownOutside={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
      onEscapeKeyDown={
        dismissable ? undefined : (event) => event.preventDefault()
      }
      onClick={(event) => {
        onClick?.(event);
        if (dismissable && event.target === event.currentTarget) {
          onOpenChange?.(false);
        }
      }}
    >
      {children}
    </Primitive.Content>
  );
}

export interface DialogAction {
  label: string;
  onClick?: () => void;
  variant?: string;
  disabled?: boolean;
}

export interface DialogProps {
  trigger?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  actions?: DialogAction[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  actions,
  open,
  onOpenChange,
}: DialogProps) {
  return (
    <DialogRoot open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogBackdrop>
        <div className={styles.panel}>
          <DialogTitle className={styles.title}>{title}</DialogTitle>
          {description && (
            <DialogDescription className={styles.description}>
              {description}
            </DialogDescription>
          )}
          {children}
          {actions && actions.length > 0 && (
            <div className={styles.actions}>
              {actions.map((action, index) => (
                <DialogClose key={index} asChild>
                  <button
                    disabled={action.disabled}
                    onClick={action.onClick}
                    data-variant={action.variant}
                  >
                    {action.label}
                  </button>
                </DialogClose>
              ))}
            </div>
          )}
        </div>
      </DialogBackdrop>
    </DialogRoot>
  );
}
