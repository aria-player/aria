import { Item, Menu, Separator, Submenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { useContext } from "react";
import { GridContext } from "../../contexts/GridContext";
import { t } from "i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addTracksToPlaylist,
  createPlaylistItem,
  selectPlaylistsLayout
} from "../../features/playlists/playlistsSlice";
import { Item as TreeItem } from "soprano-ui";
import { nanoid } from "@reduxjs/toolkit";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";
const id = "tracklistitem";

export function TrackListItemContextMenu() {
  const dispatch = useAppDispatch();
  const { updateVisibility } = useContext(MenuContext);
  const gridRef = useContext(GridContext).gridRef;
  const playlists = useAppSelector(selectPlaylistsLayout);

  const addTracks = (playlistId: string) => {
    const newItems: PlaylistItem[] = gridRef?.current?.api
      .getSelectedRows()
      .map((node) => {
        return { itemId: nanoid(), trackId: node.id };
      })
      .filter(Boolean) as PlaylistItem[];
    dispatch(
      addTracksToPlaylist({
        playlistId,
        newTracks: newItems
      })
    );
  };

  const renderFolderContent = (items: TreeItem[]) => {
    if (!items.length) return <Item disabled>{t("tracks.noItems")}</Item>;
    return items.map((item) => {
      if (item.children) {
        return (
          <Submenu label={item.name} key={item.id}>
            {renderItems(item.children, item.id)}
          </Submenu>
        );
      } else {
        return (
          <Item
            key={item.id}
            onClick={() => {
              addTracks(item.id);
            }}
          >
            {item.name}
          </Item>
        );
      }
    });
  };

  const renderItems = (items: TreeItem[], parentId?: string) => {
    return (
      <>
        <Item
          onClick={() => {
            const newPlaylistId = nanoid();
            dispatch(
              createPlaylistItem({
                newData: {
                  id: newPlaylistId,
                  name: t("sidebar.playlists.defaultPlaylist")
                },
                parentId
              })
            );
            addTracks(newPlaylistId);
          }}
        >
          {t("tracks.addToNewPlaylist")}
        </Item>
        <Separator />
        {renderFolderContent(items)}
      </>
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
      <Item disabled>
        {t("tracks.selectedCount", {
          count: gridRef?.current?.api?.getSelectedRows()?.length
        })}
      </Item>
      <Separator />
      <Submenu label={t("tracks.addToPlaylist")}>
        {renderItems(playlists)}
      </Submenu>
    </Menu>
  );
}
