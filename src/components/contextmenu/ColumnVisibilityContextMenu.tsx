import { Menu } from "react-contexify";
import { MenuItem } from "../../app/menu";
import menus from "../../../shared/menus.json";
import { AppMenu } from "../AppMenu";
import { useContext } from "react";
import { MenuContext } from "../../contexts/MenuContext";

const id = "tracklistheader";

export function ColumnVisibilityContextMenu() {
  const { updateVisibility } = useContext(MenuContext);

  const columns = (
    menus
      .find((menu: MenuItem) => menu.id === "view")
      ?.submenu.find(
        (submenu: MenuItem) => submenu.id === "columns"
      ) as MenuItem
  )?.submenu;

  return (
    <Menu
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      id={id}
      animation={false}
      onVisibilityChange={(isVisible) => updateVisibility(id, isVisible)}
    >
      {columns && <AppMenu items={columns} />}
    </Menu>
  );
}
