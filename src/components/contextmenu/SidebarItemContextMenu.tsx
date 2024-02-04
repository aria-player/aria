import { useContext } from "react";
import { Item, Menu, Separator } from "react-contexify";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { TreeContext } from "../../contexts/TreeContext";
import { MenuContext } from "../../contexts/MenuContext";
import {
  createPlaylistItem,
  deletePlaylistItem,
  openPlaylistFolder,
  selectPlaylistsLayoutItemById
} from "../../features/playlists/playlistsSlice";
import { nanoid } from "@reduxjs/toolkit";

const id = "sidebaritem";

export function SidebarItemContextMenu() {
  const dispatch = useAppDispatch();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const item = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, menuData?.itemId ?? "")
  );
  const treeRef = useContext(TreeContext)?.treeRef;

  const createItem = (isFolder: boolean) => {
    if (!menuData) return;
    dispatch(
      openPlaylistFolder({
        id: menuData.itemId
      })
    );
    treeRef?.current?.root.tree.open(menuData.itemId);
    dispatch(
      createPlaylistItem({
        newData: {
          id: nanoid(),
          name: "New Playlist",
          children: isFolder ? [] : undefined
        },
        parentId: menuData.itemId
      })
    );
  };

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
      {item?.children != undefined && (
        <>
          <Item onClick={() => createItem(false)}>Add new playlist</Item>
          <Item onClick={() => createItem(true)}>Add new folder</Item>
          <Separator />
        </>
      )}
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
