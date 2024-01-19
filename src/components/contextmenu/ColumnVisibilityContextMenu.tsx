import { Menu } from "react-contexify";
import { MenuItem } from "../../app/menu";
import menus from "../../../shared/menus.json";
import { AppMenu } from "../AppMenu";

export function ColumnVisibilityContextMenu() {
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
      id={"tracklistheader"}
      animation={false}
    >
      {columns && <AppMenu items={columns} />}
    </Menu>
  );
}
