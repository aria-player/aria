import { useEffect, useState } from "react";
import menus from "../../../../shared/menus.json";
import { Menubar } from "soprano-ui";
import { selectMenuState } from "../../../app/menu";
import { buildMenubarMenus } from "../../../app/appMenu";
import { useAppSelector } from "../../../app/hooks";
import { useMenuActions } from "../../../hooks/useMenuActions";
import { useTranslation } from "react-i18next";

export function WindowsMenuBarButtons() {
  const { t } = useTranslation();
  const menuState = useAppSelector(selectMenuState);
  const { invokeMenuAction } = useMenuActions();
  const [altHeld, setAltHeld] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Alt" && !event.repeat) {
        setAltHeld(true);
      }
    };
    const handleKeyUp = (event: KeyboardEvent) => {
      if (event.key === "Alt") {
        setAltHeld(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const menubarMenus = buildMenubarMenus(
    menus,
    menuState,
    t,
    invokeMenuAction
  ).map((menu) => ({
    ...menu,
    label: altHeld ? (
      <>
        <u>{String(menu.label).charAt(0)}</u>
        {String(menu.label).slice(1)}
      </>
    ) : (
      menu.label
    ),
  }));

  return <Menubar menus={menubarMenus} />;
}
