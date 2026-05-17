import { Item, Menu, Separator } from "react-contexify";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import {
  createPlaylistItem,
  upsertExternalPlaylist,
} from "../../features/playlists/playlistsSlice";
import { useContext } from "react";
import { MenuContext } from "../../contexts/MenuContext";
import { useTranslation } from "react-i18next";
import { TreeContext } from "../../contexts/TreeContext";
import {
  getExternalPlaylistsHandle,
  selectActivePlugins,
  selectPluginInfo,
} from "../../features/plugins/pluginsSlice";
import { showToast } from "../../app/toasts";

const id = "sidebarplaylists";

export function SidebarPlaylistsContextMenu() {
  const { t } = useTranslation();
  const { updateVisibility } = useContext(MenuContext);
  const dispatch = useAppDispatch();
  const treeRef = useContext(TreeContext)?.treeRef;
  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginInfo = useAppSelector(selectPluginInfo);

  const playlistProviders = activePlugins
    .filter((pluginId) =>
      pluginInfo[pluginId]?.capabilities?.includes("externalPlaylists")
    )
    .map((pluginId) => ({
      id: pluginId,
      name: pluginInfo[pluginId].name,
      handle: getExternalPlaylistsHandle(pluginId),
    }))
    .filter((provider) => provider.handle?.createPlaylist != null);

  return (
    <Menu
      onContextMenu={(e) => {
        if (!e.shiftKey) {
          e.preventDefault();
          return false;
        }
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
                name: t("sidebar.playlists.defaultPlaylist"),
              },
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
                children: [],
              },
            })
          );
          treeRef?.current?.root.tree.edit(newItemId);
        }}
      >
        {t("sidebar.playlists.menu.addFolder")}
      </Item>
      {playlistProviders.length > 0 && <Separator />}
      {playlistProviders.map((provider) => (
        <Item
          key={provider.id}
          onClick={async () => {
            const defaultName = t("sidebar.playlists.defaultPlaylist");
            try {
              const newId = await provider.handle!.createPlaylist!(defaultName);
              dispatch(
                upsertExternalPlaylist({
                  id: newId,
                  name: defaultName,
                  provider: provider.id,
                  permissions: "manage",
                })
              );
              treeRef?.current?.root.tree.edit(newId);
            } catch (error) {
              console.error("Failed to create external playlist:", error);
              showToast(t("toasts.createExternalPlaylistError"));
            }
          }}
        >
          {t("sidebar.playlists.menu.addExternalPlaylist", {
            provider: provider.name,
          })}
        </Item>
      ))}
    </Menu>
  );
}
