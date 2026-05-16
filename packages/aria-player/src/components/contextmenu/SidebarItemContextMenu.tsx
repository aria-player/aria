import { useContext } from "react";
import { Item, Menu, Separator } from "react-contexify";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { TreeContext } from "../../contexts/TreeContext";
import { MenuContext } from "../../contexts/MenuContext";
import {
  createPlaylistItem,
  deletePlaylistItem,
  openPlaylistFolder,
  selectPlaylistById,
  selectPlaylistsLayoutItemById,
} from "../../features/playlists/playlistsSlice";
import { nanoid } from "@reduxjs/toolkit";
import { useTranslation } from "react-i18next";
import { setQueueToNewSource } from "../../features/player/playerSlice";
import { selectSortedTrackList } from "../../features/genericSelectors";
import { store } from "../../app/store";
import { showToast } from "../../app/toasts";
import { View } from "../../app/view";
import {
  getExternalPlaylistsHandle,
  selectPluginInfo,
} from "../../features/plugins/pluginsSlice";
import {
  startPlaylistOperation,
  finishPlaylistOperation,
  selectPendingPlaylistOperations,
} from "../../features/playlists/playlistsSlice";

const id = "sidebaritem";

export function SidebarItemContextMenu() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const item = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, menuData?.itemId ?? "")
  );
  const playlist = useAppSelector((state) =>
    menuData ? selectPlaylistById(state, menuData.itemId) : undefined
  );
  const pendingPlaylistOperations = useAppSelector(
    selectPendingPlaylistOperations
  );
  const treeRef = useContext(TreeContext)?.treeRef;
  const pluginInfo = useAppSelector(selectPluginInfo);
  const plugin = playlist?.provider
    ? getExternalPlaylistsHandle(playlist.provider)
    : undefined;
  const isOperationPending =
    menuData != null && pendingPlaylistOperations[menuData.itemId] != null;
  const isExternalPlaylist = playlist?.provider != null;
  const canRename = !isExternalPlaylist || plugin?.renamePlaylist != null;
  const canDelete = !isExternalPlaylist || plugin?.deletePlaylist != null;

  const createItem = (isFolder: boolean) => {
    if (!menuData) return;
    dispatch(
      openPlaylistFolder({
        id: menuData.itemId,
      })
    );
    treeRef?.current?.root.tree.open(menuData.itemId);
    const newItemId = nanoid();
    dispatch(
      createPlaylistItem({
        newData: {
          id: newItemId,
          name: isFolder
            ? t("sidebar.playlists.defaultFolder")
            : t("sidebar.playlists.defaultPlaylist"),
          children: isFolder ? [] : undefined,
        },
        parentId: menuData.itemId,
      })
    );
    treeRef?.current?.root.tree.edit(newItemId);
  };

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
      {item?.children != undefined ? (
        <>
          <Item onClick={() => createItem(false)}>
            {t("sidebar.playlists.menu.addPlaylist")}
          </Item>
          <Item onClick={() => createItem(true)}>
            {t("sidebar.playlists.menu.addFolder")}
          </Item>
          <Separator />
        </>
      ) : (
        <>
          <Item
            onClick={() => {
              if (!menuData) return;
              const queue = selectSortedTrackList(
                store.getState(),
                View.Playlist,
                menuData.itemId
              );
              if (queue.length == 0) return;
              dispatch(
                setQueueToNewSource({
                  queue,
                  queueSource: "playlist/" + menuData.itemId,
                  queueIndex: 0,
                  queueGrouping: null,
                  queueSelectedGroup: null,
                })
              );
            }}
          >
            {t("sidebar.playlists.menu.play")}
          </Item>
          <Separator />
        </>
      )}
      <Item
        disabled={!canRename || isOperationPending}
        onClick={() => {
          if (!menuData) return;
          treeRef?.current?.root.tree.edit(menuData.itemId);
        }}
      >
        {t("sidebar.playlists.menu.rename")}
      </Item>
      <Item
        disabled={!canDelete || isOperationPending}
        onClick={async () => {
          if (!menuData || !item) return;
          if (isExternalPlaylist) {
            dispatch(startPlaylistOperation(menuData.itemId, "delete"));
            try {
              await plugin!.deletePlaylist!(menuData.itemId);
              dispatch(
                deletePlaylistItem({ id: menuData.itemId, isFolder: false })
              );
              showToast(
                t("toasts.deletedExternalPlaylistItem", {
                  name: item.name,
                  provider: pluginInfo[playlist!.provider!]?.name ?? playlist!.provider,
                })
              );
            } catch (error) {
              console.error("Failed to delete external playlist:", error);
              showToast(
                t("toasts.deleteExternalPlaylistError", { name: item.name })
              );
            } finally {
              dispatch(finishPlaylistOperation(menuData.itemId));
            }
            return;
          }

          if ((item.children?.length ?? 0) > 0) {
            const confirmed = await confirm(
              t("sidebar.playlists.menu.confirmDelete")
            );
            if (confirmed) {
              dispatch(
                deletePlaylistItem({ id: menuData.itemId, isFolder: true })
              );
              showToast(
                t("toasts.deletedPlaylistItem", {
                  name: item?.name,
                })
              );
            }
          } else {
            dispatch(
              deletePlaylistItem({
                id: menuData.itemId,
                isFolder: item?.children != undefined,
              })
            );
            showToast(
              t("toasts.deletedPlaylistItem", {
                name: item?.name,
              })
            );
          }
        }}
      >
        {t("sidebar.playlists.menu.delete")}
      </Item>
    </Menu>
  );
}
