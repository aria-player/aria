import { Menu, useContextMenu } from "react-contexify";
import menus from "../../shared/menus.json";
import MenuIcon from "../assets/bars-solid.svg?react";
import styles from "./MenuButton.module.css";
import "react-contexify/dist/ReactContexify.css";
import { useState } from "react";
import { AppMenu } from "./AppMenu";

const MENU_ID = "menubar";

export function MenuButton() {
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

  return (
    <>
      <Menu
        id={MENU_ID}
        animation={false}
        onVisibilityChange={handleVisibilityChange}
      >
        <AppMenu schema={menus} onItemClick={hideAll} />
      </Menu>
      <MenuIcon
        title="Menu"
        className={styles.menuButton}
        onClick={displayMenu}
      />
    </>
  );
}
