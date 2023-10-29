import { Menu, useContextMenu } from "react-contexify";
import menus from "../../../shared/menus.json";
import "react-contexify/dist/ReactContexify.css";
import React, { useState } from "react";
import styles from "./WindowsMenuBarButtons.module.css";
import { AppMenu } from "../AppMenu";

export function WindowsMenuBarButtons() {
  const { show, hideAll } = useContextMenu();
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
              <AppMenu
                schema={category.submenu}
                onItemClick={() => {
                  hideAll();
                  setOpen(false);
                }}
              />
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
