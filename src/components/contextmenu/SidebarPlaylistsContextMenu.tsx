import { Item, Menu } from "react-contexify";
import { useAppDispatch } from "../../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import { createPlaylistItem } from "../../features/playlists/playlistsSlice";
import { useContext } from "react";
import { MenuContext } from "../../contexts/MenuContext";
import { useTranslation } from "react-i18next";
import { TreeContext } from "../../contexts/TreeContext";

const id = "sidebarplaylists";

export function SidebarPlaylistsContextMenu() {
  const { t } = useTranslation();
  const { updateVisibility } = useContext(MenuContext);
  const dispatch = useAppDispatch();
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
          const newItemId = nanoid();
          dispatch(
            createPlaylistItem({
              newData: {
                id: newItemId,
                name: t("sidebar.playlists.defaultPlaylist")
              }
            })
          );
          treeRef?.current?.root.tree.edit(newItemId);
        }}
      >
        {t("sidebar.playlists.menu.addPlaylist")}
      </Item>
      <Item
        onClick={() => {
          const newItemId = nanoid();
          dispatch(
            createPlaylistItem({
              newData: {
                id: newItemId,
                name: t("sidebar.playlists.defaultFolder"),
                children: []
              }
            })
          );
          treeRef?.current?.root.tree.edit(newItemId);
        }}
      >
        {t("sidebar.playlists.menu.addFolder")}
      </Item>
    </Menu>
  );
}
