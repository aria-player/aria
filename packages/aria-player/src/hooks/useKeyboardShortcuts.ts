import { useEffect } from "react";
import menus from "../../shared/menus.json";
import { MenuItem } from "../app/menu";
import { useContextMenu } from "react-contexify";
import { useMenuActions } from "./useMenuActions";
import { IS_MAC_LIKE } from "../app/constants";

export const useKeyboardShortcuts = () => {
  const { hideAll } = useContextMenu();
  const { invokeMenuAction } = useMenuActions();

  useEffect(() => {
    const shortcuts: Record<string, string> = {};

    function extractShortcuts(menuItems: MenuItem[]) {
      menuItems.forEach((item) => {
        if (item.shortcut) {
          const shortcut = IS_MAC_LIKE
            ? item.shortcut.split("Ctrl").join("Cmd")
            : item.shortcut;
          shortcuts[shortcut] = item.id;
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
      if (IS_MAC_LIKE ? event.metaKey : event.ctrlKey)
        keys.push(IS_MAC_LIKE ? "Cmd" : "Ctrl");
      if (event.shiftKey) keys.push("Shift");
      const keyName =
        event.key.length === 1 ? event.key.toUpperCase() : event.key;
      keys.push(keyName === " " ? "Space" : keyName);
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
