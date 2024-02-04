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
import { useTranslation } from "react-i18next";

const id = "sidebaritem";

export function SidebarItemContextMenu() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
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
          name: isFolder
            ? t("sidebar.playlists.defaultFolder")
            : t("sidebar.playlists.defaultPlaylist"),
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
          <Item onClick={() => createItem(false)}>
            {t("sidebar.playlists.menu.addPlaylist")}
          </Item>
          <Item onClick={() => createItem(true)}>
            {t("sidebar.playlists.menu.addFolder")}
          </Item>
          <Separator />
        </>
      )}
      <Item
        onClick={() => {
          if (!menuData) return;
          treeRef?.current?.root.tree.edit(menuData.itemId);
        }}
      >
        {t("sidebar.playlists.menu.rename")}
      </Item>
      <Item
        onClick={() => {
          if (!menuData) return;
          if (item?.children?.length ?? 0 > 0) {
            const confirmed = confirm(
              t("sidebar.playlists.menu.confirmDelete")
            );
            if (confirmed) {
              dispatch(deletePlaylistItem({ id: menuData.itemId }));
            }
          } else {
            dispatch(deletePlaylistItem({ id: menuData.itemId }));
          }
        }}
      >
        {t("sidebar.playlists.menu.delete")}
      </Item>
    </Menu>
  );
}
