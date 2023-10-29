import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  Submenu,
  Item,
  Menu,
  useContextMenu,
  RightSlot
} from "react-contexify";
import { MenuItem, handleMenuAction, selectMenuState } from "../app/menu";
import menus from "../../shared/menus.json";

import { isTauri } from "../app/utils";

import MenuIcon from "../assets/bars-solid.svg?react";

import styles from "./MenuButton.module.css";
import "react-contexify/dist/ReactContexify.css";
import { useState } from "react";

const MENU_ID = "menu-id";

export function MenuButton() {
  const dispatch = useAppDispatch();
  const { show, hideAll } = useContextMenu();
  const [open, setOpen] = useState(false);
  const menuState = useAppSelector(selectMenuState);

  const handleVisibilityChange = (isVisible: boolean) => {
    setOpen(isVisible);
  };

  const displayMenu = (e: React.MouseEvent) => {
    if (open) {
      hideAll();
      return;
    }
    const targetDiv = e.currentTarget as HTMLDivElement;
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

  function constructMenuFromSchema(schema: MenuItem[]) {
    if (
      (!isTauri() && schema.every((item) => item.tauri === true)) ||
      schema.length === 0
    ) {
      return (
        <Item disabled>
          <i>(no actions)</i>
        </Item>
      );
    }
    return schema.map((item: MenuItem) => {
      if (item.tauri && !isTauri()) {
        return null;
      }
      if (item.submenu) {
        return (
          <Submenu key={item.id} label={item.label}>
            {constructMenuFromSchema(item.submenu)}
          </Submenu>
        );
      }
      return (
        <Item
          onClick={() => {
            handleMenuAction(dispatch, item.id);
            hideAll();
          }}
          key={item.id}
          disabled={menuState[item.id as keyof typeof menuState]?.disabled}
        >
          {item.label}
          <RightSlot>{item.shortcut}</RightSlot>
        </Item>
      );
    });
  }

  return (
    <>
      <Menu
        id={MENU_ID}
        animation={false}
        onVisibilityChange={handleVisibilityChange}
      >
        {constructMenuFromSchema(menus)}
      </Menu>
      <MenuIcon
        title="Menu"
        className={styles.menuButton}
        onClick={displayMenu}
      />
    </>
  );
}
