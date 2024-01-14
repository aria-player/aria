import { useEffect } from "react";
import menus from "../../shared/menus.json";
import { MenuItem } from "../app/menu";
import { useContextMenu } from "react-contexify";
import { useMenuActions } from "./useMenuActions";

export const useKeyboardShortcuts = () => {
  const { hideAll } = useContextMenu();
  const { invokeMenuAction } = useMenuActions();

  useEffect(() => {
    const shortcuts: Record<string, string> = {};

    function extractShortcuts(menuItems: MenuItem[]) {
      menuItems.forEach((item) => {
        if (item.shortcut) {
          shortcuts[item.shortcut] = item.id;
        }
        if (item.submenu) {
          extractShortcuts(item.submenu);
        }
      });
    }

    extractShortcuts(menus);

    const handleKeyDown = (event: KeyboardEvent) => {
      const keys = [];
      if (event.altKey) keys.push("Alt");
      if (event.ctrlKey) keys.push("Ctrl");
      if (event.shiftKey) keys.push("Shift");
      keys.push(event.key.toUpperCase());
      const shortcut = keys.join("+");

      const action = shortcuts[shortcut];
      if (action) {
        event.preventDefault();
        invokeMenuAction(action);
        hideAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [invokeMenuAction, hideAll]);
};
