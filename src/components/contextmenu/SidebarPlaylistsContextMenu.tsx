import { Item, Menu } from "react-contexify";
import { useAppDispatch } from "../../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import { createPlaylistItem } from "../../features/playlists/playlistsSlice";
import { useContext } from "react";
import { MenuContext } from "../../contexts/MenuContext";
import { useTranslation } from "react-i18next";

const id = "sidebarplaylists";

export function SidebarPlaylistsContextMenu() {
  const { t } = useTranslation();
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
          dispatch(
            createPlaylistItem({
              newData: {
                id: nanoid(),
                name: t("sidebar.playlists.defaultPlaylist")
              }
            })
          );
        }}
      >
        {t("sidebar.playlists.menu.addPlaylist")}
      </Item>
      <Item
        onClick={() => {
          dispatch(
            createPlaylistItem({
              newData: {
                id: nanoid(),
                name: t("sidebar.playlists.defaultFolder"),
                children: []
              }
            })
          );
        }}
      >
        {t("sidebar.playlists.menu.addFolder")}
      </Item>
    </Menu>
  );
}
