import { Menu, useContextMenu } from "react-contexify";
import menus from "../../../shared/menus.json";
import ChevronDownIcon from "../../assets/chevron-down-solid.svg?react";
import AppIcon from "../../../app-icon.svg?react";
import styles from "./SidebarMenu.module.css";
import { useState } from "react";
import { AppMenu } from "../appmenu/AppMenu";
import { useTranslation } from "react-i18next";

const MENU_ID = "menubar";

export function SidebarMenu() {
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
    const buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    show({
      id: MENU_ID,
      event: e,
      position: {
        x: buttonRect.left,
        y: buttonRect.bottom,
      },
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
        className={`app-menu-button ${styles.sidebarMenu}`}
        onClick={displayMenu}
      >
        <AppIcon className={styles.appIcon} />
        <span className={styles.appName}>{t("sidebar.appName")}</span>
        <ChevronDownIcon className={styles.chevron} />
      </button>
    </>
  );
}
