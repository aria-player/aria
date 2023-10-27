import { useAppDispatch } from "../app/hooks";
import {
  Submenu,
  Item,
  Menu,
  useContextMenu,
  RightSlot
} from "react-contexify";
import { menus, handleMenuAction } from "../app/menu";
import { isTauri } from "../app/utils";

import MenuIcon from "../assets/bars-solid.svg?react";

import styles from "./MenuButton.module.css";
import "react-contexify/dist/ReactContexify.css";
import { useState } from "react";

interface MenuItemSchema {
  id: string;
  label: string;
  shortcut?: string;
  submenu?: MenuItemSchema[];
  tauri?: boolean;
}

const MENU_ID = "menu-id";

export function MenuButton() {
  const dispatch = useAppDispatch();
  const { show, hideAll } = useContextMenu({
    id: MENU_ID
  });
  const [open, setOpen] = useState(false);

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

  function constructMenuFromSchema(schema: MenuItemSchema[]) {
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
    return schema.map((item: MenuItemSchema) => {
      if (item.submenu) {
        return (
          <Submenu key={item.id} label={item.label}>
            {constructMenuFromSchema(item.submenu)}
          </Submenu>
        );
      }
      return (
        <Item onClick={() => handleMenuAction(dispatch, item.id)} key={item.id}>
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
