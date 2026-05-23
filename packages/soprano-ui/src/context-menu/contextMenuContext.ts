import { createContext, useContext } from "react";
import type { MenuItem } from "../shared/menu-types";

export type ShowContextMenu = (
  event:
    | MouseEvent
    | React.MouseEvent
    | { clientX: number; clientY: number; preventDefault?: () => void },
  items: MenuItem[] | (() => MenuItem[]),
  options?: { onClose?: () => void; subscribe?: (cb: () => void) => () => void }
) => void;

export const ContextMenuContext = createContext<ShowContextMenu | null>(null);

export function useContextMenu(): ShowContextMenu {
  const ctx = useContext(ContextMenuContext);
  if (!ctx)
    throw new Error("useContextMenu must be used within ContextMenuProvider");
  return ctx;
}
