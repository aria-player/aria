import { useContext } from "react";
import { Item, Menu } from "react-contexify";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { TreeContext } from "../../contexts/TreeContext";
import { MenuContext } from "../../contexts/MenuContext";
import {
  deletePlaylistItem,
  selectPlaylistsLayoutItemById
} from "../../features/playlists/playlistsSlice";

const id = "sidebaritem";

export function SidebarItemContextMenu() {
  const dispatch = useAppDispatch();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const item = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, menuData?.itemId ?? "")
  );
  const treeRef = useContext(TreeContext)?.treeRef;

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
          if (!menuData) return;
          treeRef?.current?.root.tree.edit(menuData.itemId);
        }}
      >
        Rename...
      </Item>
      <Item
        onClick={() => {
          if (!menuData) return;
          if (item?.children?.length ?? 0 > 0) {
            const confirmed = confirm(
              "Deleting this folder will also delete all of its contents. Are you sure?"
            );
            if (confirmed) {
              dispatch(deletePlaylistItem({ id: menuData.itemId }));
            }
          } else {
            dispatch(deletePlaylistItem({ id: menuData.itemId }));
          }
        }}
      >
        Delete
      </Item>
    </Menu>
  );
}
