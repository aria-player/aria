import { useEffect } from "react";
import menus from "../../shared/menus.json";
import { MenuItem, handleMenuAction } from "../app/menu";
import { useContextMenu } from "react-contexify";
import { useAppDispatch } from "../app/hooks";

export const useKeyboardShortcuts = () => {
  const dispatch = useAppDispatch();
  const { hideAll } = useContextMenu();

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

    const handleKeyDown = async (event: KeyboardEvent) => {
      const keys = [];
      if (event.altKey) keys.push("Alt");
      if (event.ctrlKey) keys.push("Ctrl");
      if (event.shiftKey) keys.push("Shift");
      keys.push(event.key.toUpperCase());
      const shortcut = keys.join("+");

      const action = shortcuts[shortcut];
      if (action) {
        event.preventDefault();
        await handleMenuAction(dispatch, action);
        hideAll();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch, hideAll]);
};
