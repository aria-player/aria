import { useContext } from "react";
import { Item, Menu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";

const id = "track";

export function TrackContextMenu() {
  const { updateVisibility, menuData } = useContext(MenuContext);

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
      <Item>{menuData?.metadata?.title}</Item>
    </Menu>
  );
}
