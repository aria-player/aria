import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  Submenu,
  Item,
  Menu,
  useContextMenu,
  RightSlot
} from "react-contexify";
import { MenuItem, handleMenuAction, selectMenuState } from "../../app/menu";
import menus from "../../../shared/menus.json";
import { isTauri } from "../../app/utils";
import "react-contexify/dist/ReactContexify.css";
import React, { useState } from "react";

import styles from "./WindowsMenuBarButtons.module.css";

export function WindowsMenuBarButtons() {
  const dispatch = useAppDispatch();
  const { show, hideAll } = useContextMenu();
  const menuState = useAppSelector(selectMenuState);
  const [open, setOpen] = useState(false);

  const showMenu = (e: React.MouseEvent, menuId: string) => {
    const targetDiv = e.currentTarget as HTMLDivElement;
    const divRect = targetDiv?.getBoundingClientRect();
    if (!divRect) return;
    show({
      id: menuId,
      event: e,
      position: {
        x: divRect.left,
        y: divRect.bottom + 4
      }
    });
  };

  const handleVisibilityChange = (isVisible: boolean) => {
    if (open == true && isVisible == false) {
      setOpen(false);
    }
  };

  const handleMenuHover = (e: React.MouseEvent, menuId: string) => {
    if (!open) return;
    hideAll();
    showMenu(e, menuId);
  };

  const handleMenuClick = (e: React.MouseEvent, menuId: string) => {
    if (open) {
      hideAll();
      setOpen(false);
      return;
    }
    setOpen(true);
    showMenu(e, menuId);
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
            setOpen(false);
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
      {menus.map((category) => {
        return (
          <React.Fragment key={category.id}>
            <Menu
              id={category.id}
              animation={false}
              onVisibilityChange={handleVisibilityChange}
            >
              {constructMenuFromSchema(category.submenu)}
            </Menu>
            <button
              className={styles.menuButton}
              onClick={(e) => handleMenuClick(e, category.id)}
              onMouseOver={(e) => handleMenuHover(e, category.id)}
            >
              {category.label}
            </button>
          </React.Fragment>
        );
      })}
    </>
  );
}
