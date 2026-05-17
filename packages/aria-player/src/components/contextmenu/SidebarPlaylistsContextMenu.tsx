import { Item, Menu, Separator } from "react-contexify";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import {
  createPlaylistItem,
  upsertExternalPlaylist,
} from "../../features/playlists/playlistsSlice";
import { useContext, useState } from "react";
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
  const [refreshingProviders, setRefreshingProviders] = useState<
    Partial<Record<string, true>>
  >({});

  const externalPlaylistProviders = activePlugins
    .filter((pluginId) =>
      pluginInfo[pluginId]?.capabilities?.includes("externalPlaylists")
    )
    .map((pluginId) => ({
      id: pluginId,
      name: pluginInfo[pluginId].name,
      handle: getExternalPlaylistsHandle(pluginId),
    }));
  const creatablePlaylistProviders = externalPlaylistProviders.filter(
    (provider) => provider.handle?.createPlaylist != null
  );
  const refreshablePlaylistProviders = externalPlaylistProviders.filter(
    (provider) => provider.handle?.refreshPlaylists != null
  );

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
      {(creatablePlaylistProviders.length > 0 ||
        refreshablePlaylistProviders.length > 0) && <Separator />}
      {creatablePlaylistProviders.map((provider) => (
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
      {creatablePlaylistProviders.length > 0 &&
        refreshablePlaylistProviders.length > 0 && <Separator />}
      {refreshablePlaylistProviders.map((provider) => (
        <Item
          key={`${provider.id}:refresh`}
          disabled={refreshingProviders[provider.id] === true}
          onClick={async () => {
            if (
              !provider.handle?.refreshPlaylists ||
              refreshingProviders[provider.id]
            ) {
              return;
            }
            setRefreshingProviders((previousProviders) => ({
              ...previousProviders,
              [provider.id]: true,
            }));
            try {
              await provider.handle.refreshPlaylists();
            } catch (error) {
              console.error("Failed to refresh external playlists:", error);
              showToast(
                t("toasts.refreshExternalPlaylistsError", {
                  provider: provider.name,
                })
              );
            } finally {
              setRefreshingProviders((previousProviders) => {
                const updatedProviders = { ...previousProviders };
                delete updatedProviders[provider.id];
                return updatedProviders;
              });
            }
          }}
        >
          {t("sidebar.playlists.menu.refreshExternalPlaylists", {
            provider: provider.name,
          })}
        </Item>
      ))}
    </Menu>
  );
}
