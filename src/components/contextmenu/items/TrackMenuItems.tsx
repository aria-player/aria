import { Item, Separator, Submenu, useContextMenu } from "react-contexify";
import { MenuContext } from "../../../contexts/MenuContext";
import { useContext } from "react";
import { GridContext } from "../../../contexts/GridContext";
import { t } from "i18next";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  addTracksToPlaylist,
  createPlaylistItem,
  selectPlaylistsLayout
} from "../../../features/playlists/playlistsSlice";
import { Item as TreeItem } from "soprano-ui";
import { nanoid } from "@reduxjs/toolkit";
import { PlaylistItem } from "../../../features/playlists/playlistsTypes";
import { store } from "../../../app/store";
import { LibraryView, TrackGrouping } from "../../../app/view";
import { addTracksToUpNext } from "../../../features/player/playerSlice";
import {
  selectVisibleViewType,
  selectVisibleSelectedTrackGroup
} from "../../../features/visibleSelectors";
import { BASEPATH } from "../../../app/constants";
import { push } from "redux-first-history";
import {
  selectLibrarySplitViewStates,
  setSelectedAlbum,
  updateLibrarySplitState
} from "../../../features/library/librarySlice";

export function TrackMenuItems() {
  const dispatch = useAppDispatch();
  const { hideAll } = useContextMenu();
  const { menuData } = useContext(MenuContext);
  const gridRef = useContext(GridContext).gridRef;
  const playlists = useAppSelector(selectPlaylistsLayout);
  const visibleView = useAppSelector(selectVisibleViewType);
  const visibleSelectedGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const librarySplitViewStates = useAppSelector(selectLibrarySplitViewStates);

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

  const showGoTo = (
    view: LibraryView,
    group?: string | string[],
    grouping?: TrackGrouping
  ) =>
    group != null &&
    !(visibleView == view && visibleSelectedGroup == group) &&
    (grouping === undefined ||
      librarySplitViewStates[view].trackGrouping == grouping);

  const showGoToAlbum = showGoTo(LibraryView.Albums, menuData?.metadata?.album);
  const showGoToAlbumArtist = showGoTo(
    LibraryView.Artists,
    menuData?.metadata?.albumArtist,
    TrackGrouping.AlbumArtist
  );
  const showGoToArtist = showGoTo(
    LibraryView.Artists,
    menuData?.metadata?.artist,
    TrackGrouping.Artist
  );

  function goToArtist(artist?: string | string[]) {
    dispatch(push(BASEPATH + "artists"));
    dispatch(
      updateLibrarySplitState({
        view: LibraryView.Artists,
        splitState: {
          selectedGroup: Array.isArray(artist) ? artist[0] : artist
        }
      })
    );
    hideAll();
  }

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
    <>
      {showGoToAlbum && (
        <>
          <Item
            onClick={() => {
              if (menuData?.metadata?.album == undefined) return;
              dispatch(push(BASEPATH + "albums"));
              dispatch(setSelectedAlbum(menuData.metadata.album));
              hideAll();
            }}
          >
            {t("tracks.goToAlbum")}
          </Item>
        </>
      )}
      {showGoToAlbumArtist ? (
        <Item onClick={() => goToArtist(menuData?.metadata?.albumArtist)}>
          {t("tracks.goToArtist")}
        </Item>
      ) : showGoToArtist ? (
        menuData?.metadata?.artist &&
        Array.isArray(menuData.metadata.artist) &&
        menuData.metadata.artist.length > 1 ? (
          <Submenu label={t("tracks.goToArtist")}>
            {menuData.metadata.artist.map(
              (artist) =>
                showGoTo(LibraryView.Artists, artist, TrackGrouping.Artist) && (
                  <Item onClick={() => goToArtist(artist)} key={artist}>
                    {artist}
                  </Item>
                )
            )}
          </Submenu>
        ) : (
          <Item onClick={() => goToArtist(menuData?.metadata?.artist)}>
            {t("tracks.goToArtist")}
          </Item>
        )
      ) : null}
      {(showGoToAlbum || showGoToAlbumArtist || showGoToArtist) && (
        <Separator />
      )}
      <Item
        onClick={() => {
          dispatch(
            addTracksToUpNext({
              dropIndex: 0,
              tracks: store.getState().tracks.selectedTracks.map((track) => ({
                trackId: track.trackId,
                itemId: nanoid()
              }))
            })
          );
        }}
      >
        {t("tracks.playNext")}
      </Item>
      <Item
        onClick={() => {
          dispatch(
            addTracksToUpNext({
              tracks: store.getState().tracks.selectedTracks.map((track) => ({
                trackId: track.trackId,
                itemId: nanoid()
              }))
            })
          );
        }}
      >
        {t("tracks.addToQueue")}
      </Item>
      <Separator />
      <Submenu label={t("tracks.addToPlaylist")}>
        {renderItems(playlists)}
      </Submenu>
    </>
  );
}
