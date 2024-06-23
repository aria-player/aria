import {
  Item,
  Menu,
  Separator,
  Submenu,
  useContextMenu
} from "react-contexify";
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
import { selectSelectedTracks } from "../../features/tracks/tracksSlice";
import { store } from "../../app/store";
import { DisplayMode, LibraryView, TrackGrouping, View } from "../../app/view";
import {
  addTracksToUpNext,
  removeFromQueue,
  setQueueToNewSource,
  skipQueueIndexes
} from "../../features/player/playerSlice";
import { selectSortedTrackList } from "../../features/genericSelectors";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisibleDisplayMode,
  selectVisibleGroupFilteredTrackList,
  selectVisibleTrackGrouping,
  selectVisibleSelectedTrackGroup,
  selectVisibleTracks
} from "../../features/visibleSelectors";
import {
  addToSearchHistory,
  selectSearch
} from "../../features/search/searchSlice";
import { BASEPATH } from "../../app/constants";
import { push } from "redux-first-history";
import {
  selectLibrarySplitViewStates,
  setSelectedAlbum,
  updateLibrarySplitState
} from "../../features/library/librarySlice";
const id = "tracklistitem";

export function TrackListItemContextMenu() {
  const dispatch = useAppDispatch();
  const { hideAll } = useContextMenu();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const gridRef = useContext(GridContext).gridRef;
  const playlists = useAppSelector(selectPlaylistsLayout);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleView = useAppSelector(selectVisibleViewType);
  const visibleSelectedGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const selectedTracks = useAppSelector(selectSelectedTracks);
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
            const state = store.getState();
            const source = selectPlaylistById(
              state,
              menuData.itemSource ?? ""
            )?.id;
            if (visibleView == View.Search) {
              dispatch(addToSearchHistory(selectSearch(state)));
            }
            dispatch(
              setQueueToNewSource({
                queue:
                  selectVisibleDisplayMode(state) == DisplayMode.TrackList
                    ? visibleView == View.Search
                      ? selectVisibleTracks(state)
                      : selectSortedTrackList(state, source ?? undefined)
                    : selectVisibleGroupFilteredTrackList(state),
                queueSource: menuData.itemSource ?? LibraryView.Songs,
                queueIndex: menuData.itemIndex ?? 0,
                queueGrouping: selectVisibleTrackGrouping(state) ?? null,
                queueSelectedGroup:
                  selectVisibleSelectedTrackGroup(state) ?? null
              })
            );
          }
        }}
      >
        {t("tracks.playNamedTrack", {
          title: menuData?.metadata?.title
        })}
      </Item>
      <Separator />
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
      {visibleView == View.Queue && menuData?.itemIndex != 0 && (
        <>
          <Separator />
          <Item
            onClick={() => {
              dispatch(
                removeFromQueue(selectedTracks.map((track) => track.itemId))
              );
            }}
          >
            {t("tracks.removeFromQueue")}
          </Item>
        </>
      )}
    </Menu>
  );
}
