import { Item, Menu, Separator, Submenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { useContext } from "react";
import { GridContext } from "../../contexts/GridContext";
import { t } from "i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  addTracksToPlaylist,
  createPlaylistItem,
  removeTracksFromPlaylist,
  selectPlaylistById,
  selectPlaylistsLayout
} from "../../features/playlists/playlistsSlice";
import { Item as TreeItem } from "soprano-ui";
import { nanoid } from "@reduxjs/toolkit";
import { PlaylistItem } from "../../features/playlists/playlistsTypes";
import {
  selectSortedTrackList,
  selectVisiblePlaylist
} from "../../features/sharedSelectors";
import {
  selectSelectedTracks,
  selectTrackById
} from "../../features/tracks/tracksSlice";
import { store } from "../../app/store";
import { LibraryView, View } from "../../app/view";
import {
  setQueueToNewSource,
  skipQueueIndexes
} from "../../features/player/playerSlice";
const id = "tracklistitem";

export function TrackListItemContextMenu() {
  const dispatch = useAppDispatch();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const gridRef = useContext(GridContext).gridRef;
  const playlists = useAppSelector(selectPlaylistsLayout);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedTracks = useAppSelector(selectSelectedTracks);

  const track = useAppSelector((state) =>
    selectTrackById(state, menuData?.itemId ?? "")
  );
  const trackTitle = track?.title;

  const addTracks = (playlistId: string) => {
    const newItems: PlaylistItem[] = gridRef?.current?.api
      .getSelectedRows()
      .map((node) => {
        return { itemId: nanoid(), trackId: node.trackId };
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
            // TODO: Some kind of visual feedback indicating the tracks have been added
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
          count: selectedTracks.length
        })}
      </Item>
      <Separator />
      <Item
        onClick={() => {
          if (!menuData) return;
          if (menuData.itemSource == View.Queue) {
            dispatch(skipQueueIndexes(menuData.itemIndex));
          } else {
            const source = selectPlaylistById(
              store.getState(),
              menuData.itemSource ?? ""
            )?.id;
            dispatch(
              setQueueToNewSource({
                queue: selectSortedTrackList(
                  store.getState(),
                  source ?? undefined
                ),
                queueSource: menuData.itemSource ?? LibraryView.Songs,
                queueIndex: menuData.itemIndex ?? 0
              })
            );
          }
        }}
      >
        {t("tracks.playNamedTrack", {
          title: trackTitle
        })}
      </Item>
      <Separator />
      <Submenu label={t("tracks.addToPlaylist")}>
        {renderItems(playlists)}
      </Submenu>
      {visiblePlaylist && (
        <Item
          onClick={() => {
            dispatch(
              removeTracksFromPlaylist({
                playlistId: visiblePlaylist.id,
                itemIds: selectedTracks.map((track) => track.itemId)
              })
            );
          }}
        >
          {t("tracks.removeFromPlaylist")}
        </Item>
      )}
    </Menu>
  );
}
