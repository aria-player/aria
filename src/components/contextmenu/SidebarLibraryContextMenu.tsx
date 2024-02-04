import { useContext } from "react";
import { Item, Menu, Separator } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";

const id = "sidebarlibrary";

export function SidebarLibraryContextMenu() {
  const { updateVisibility } = useContext(MenuContext);

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
      <Item
        onClick={() => {
          // Tree API interaction here
        }}
      >
        Edit sections...
      </Item>
      <Separator />
      <Item>Reset to default layout</Item>
    </Menu>
  );
}
