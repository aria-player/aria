import { Menu, useContextMenu } from "react-contexify";
import menus from "../../../shared/menus.json";
import MenuIcon from "../../assets/bars-solid.svg?react";
import styles from "./MenuButton.module.css";
import { useState } from "react";
import { AppMenu } from "./AppMenu";
import { useTranslation } from "react-i18next";

const MENU_ID = "menubar";

export function MenuButton() {
  const { t } = useTranslation();

  const { show, hideAll } = useContextMenu();
  const [open, setOpen] = useState(false);

  const handleVisibilityChange = (isVisible: boolean) => {
    setOpen(isVisible);
  };

  const displayMenu = (e: React.MouseEvent) => {
    if (open) {
      hideAll();
      return;
    }
    const targetDiv = e.currentTarget;
    const divRect = targetDiv.parentElement?.getBoundingClientRect();
    if (!divRect) return;
    show({
      id: MENU_ID,
      event: e,
      position: {
        x: divRect.left,
        y: divRect.bottom
      }
    });
  };

  return (
    <>
      <Menu
        id={MENU_ID}
        animation={false}
        onVisibilityChange={handleVisibilityChange}
      >
        <AppMenu items={menus} onItemClick={hideAll} />
      </Menu>
      <button
        title={t("labels.menu")}
        className={`app-menu-button ${styles.menuButton}`}
        onClick={displayMenu}
      >
        <MenuIcon />
      </button>
    </>
  );
}
