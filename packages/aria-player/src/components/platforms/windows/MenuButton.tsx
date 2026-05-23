import menus from "../../../../shared/menus.json";
import MenuIcon from "../../../assets/bars-solid.svg?react";
import styles from "./MenuButton.module.css";
import { DropdownMenu } from "soprano-ui";
import { selectMenuState } from "../../../app/menu";
import { buildMenuItems } from "../../../app/appMenu";
import { useAppSelector } from "../../../app/hooks";
import { useMenuActions } from "../../../hooks/useMenuActions";
import { useTranslation } from "react-i18next";

export function MenuButton() {
  const { t } = useTranslation();
  const menuState = useAppSelector(selectMenuState);
  const { invokeMenuAction } = useMenuActions();

  const items = buildMenuItems(menus, menuState, t, invokeMenuAction);

  return (
    <DropdownMenu
      trigger={
        <button
          title={t("labels.menu")}
          className={`app-menu-button ${styles.menuButton}`}
        >
          <MenuIcon />
        </button>
      }
      items={items}
    />
  );
}
