import { useState, useCallback, useRef } from "react";
import type { ReactNode } from "react";
import { ContextMenu as Primitive } from "radix-ui";
import { MenuItems } from "../shared/MenuItems";
import type { MenuItem } from "../shared/menu-types";
import styles from "../shared/menu.module.css";
import { ContextMenuContext, type ShowContextMenu } from "./contextMenuContext";

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>([]);
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const factoryRef = useRef<(() => MenuItem[]) | null>(null);
  const onCloseRef = useRef<(() => void) | null>(null);

  const showContextMenu = useCallback<ShowContextMenu>(
    (event, itemsOrFactory, options) => {
      (event as { preventDefault?: () => void }).preventDefault?.();
      factoryRef.current =
        typeof itemsOrFactory === "function"
          ? itemsOrFactory
          : () => itemsOrFactory;
      onCloseRef.current = options?.onClose ?? null;
      const subscribe = options?.subscribe ?? null;
      triggerRef.current?.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: event.clientX,
          clientY: event.clientY,
        })
      );
      if (subscribe) {
        unsubscribeRef.current = subscribe(() => {
          setItems(factoryRef.current!());
        });
      }
    },
    []
  );

  const handleOpenChange = useCallback((open: boolean) => {
    if (open) {
      setItems(factoryRef.current!());
    } else {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      factoryRef.current = null;
      onCloseRef.current?.();
      onCloseRef.current = null;
    }
  }, []);

  return (
    <ContextMenuContext.Provider value={showContextMenu}>
      {children}
      <Primitive.Root onOpenChange={handleOpenChange}>
        <Primitive.Trigger asChild>
          <div
            ref={triggerRef}
            style={{
              position: "fixed",
              pointerEvents: "none",
              width: 0,
              height: 0,
            }}
          />
        </Primitive.Trigger>
        <Primitive.Portal>
          <Primitive.Content
            className={styles.content}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <MenuItems items={items} primitives={Primitive} />
          </Primitive.Content>
        </Primitive.Portal>
      </Primitive.Root>
    </ContextMenuContext.Provider>
  );
}
