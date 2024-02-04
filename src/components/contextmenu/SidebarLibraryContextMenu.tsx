import { useContext } from "react";
import { Item, Menu, Separator } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { TreeContext } from "../../contexts/TreeContext";
import { useAppDispatch } from "../../app/hooks";
import { resetLibraryLayout } from "../../features/library/librarySlice";

const id = "sidebarlibrary";

export function SidebarLibraryContextMenu() {
  const treeRef = useContext(TreeContext).treeRef;
  const { updateVisibility } = useContext(MenuContext);
  const dispatch = useAppDispatch();

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
          if (treeRef?.current?.visibilityEditing) {
            treeRef?.current?.setVisibilityEditing(null);
          } else {
            treeRef?.current?.setVisibilityEditing("library");
          }
        }}
      >
        {treeRef?.current?.visibilityEditing
          ? "Save changes"
          : "Edit sections..."}
      </Item>
      <Separator />
      <Item
        onClick={() => {
          dispatch(resetLibraryLayout());
        }}
      >
        Reset to default layout
      </Item>
    </Menu>
  );
}
