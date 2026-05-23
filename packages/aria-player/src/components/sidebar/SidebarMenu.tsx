import menus from "../../../shared/menus.json";
import ChevronDownIcon from "../../assets/chevron-down-solid.svg?react";
import AppIcon from "../../../app-icon.svg?react";
import styles from "./SidebarMenu.module.css";
import { DropdownMenu } from "soprano-ui";
import { selectMenuState } from "../../app/menu";
import { buildMenuItems } from "../../app/appMenu";
import { useAppSelector } from "../../app/hooks";
import { useMenuActions } from "../../hooks/useMenuActions";
import { useTranslation } from "react-i18next";

export function SidebarMenu() {
  const { t } = useTranslation();
  const menuState = useAppSelector(selectMenuState);
  const { invokeMenuAction } = useMenuActions();

  const items = buildMenuItems(menus, menuState, t, invokeMenuAction);

  return (
    <DropdownMenu
      trigger={
        <button
          className={`app-menu-button ${styles.sidebarMenu}`}
          title={t("labels.menu")}
        >
          <AppIcon className={styles.appIcon} />
          <span className={styles.appName}>{t("sidebar.appName")}</span>
          <ChevronDownIcon className={styles.chevron} />
        </button>
      }
      items={items}
    />
  );
}
