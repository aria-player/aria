import { Item, Menu, Separator } from "react-contexify";

const id = "sidebarlibrary";

export function SidebarLibraryContextMenu() {
  return (
    <Menu
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      id={id}
      animation={false}
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
