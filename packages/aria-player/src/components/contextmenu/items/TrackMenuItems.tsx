import { Item, Separator, Submenu, useContextMenu } from "react-contexify";
import { MenuContext } from "../../../contexts/MenuContext";
import { useContext } from "react";
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
import {
  addTracks,
  removeTracks,
  selectSelectedTracks,
  selectTrackById
} from "../../../features/tracks/tracksSlice";
import { View } from "../../../app/view";
import { addTracksToUpNext } from "../../../features/player/playerSlice";
import {
  selectVisibleViewType,
  selectVisibleSelectedTrackGroup
} from "../../../features/visibleSelectors";
import { BASEPATH } from "../../../app/constants";
import { push } from "redux-first-history";
import { showToast } from "../../../app/toasts";
import {
  pluginHandles,
  selectPluginInfo
} from "../../../features/plugins/pluginsSlice";
import { normalizeArtists } from "../../../app/utils";
import { selectArtistDelimiter } from "../../../features/config/configSlice";
import { TrackMetadata } from "../../../../../types";
import { store } from "../../../app/store";

export function TrackMenuItems() {
  const dispatch = useAppDispatch();
  const { hideAll } = useContextMenu();
  const { menuData } = useContext(MenuContext);
  const playlists = useAppSelector(selectPlaylistsLayout);
  const visibleView = useAppSelector(selectVisibleViewType);
  const visibleSelectedGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const selectedTracks = useAppSelector(selectSelectedTracks);
  const delimiter = useAppSelector(selectArtistDelimiter);
  const pluginInfo = useAppSelector(selectPluginInfo);

  const tracksForActions =
    menuData?.type == "track" && menuData.metadata
      ? [menuData.metadata]
      : selectedTracks.map(
          (item) => selectTrackById(store.getState(), item.trackId)!
        );

  const sourceForActions = tracksForActions[0]?.source;
  const allSameSource = tracksForActions.every(
    (track) => track.source === sourceForActions
  );
  const remoteLibraryHandle =
    sourceForActions && allSameSource ? pluginHandles[sourceForActions] : null;
  const sourceDisplayName = sourceForActions
    ? pluginHandles[sourceForActions]?.displayName ||
      pluginInfo[sourceForActions]?.name ||
      sourceForActions
    : null;
  const hasUnaddedTracks = tracksForActions.some(
    (track) => track.isInLibrary !== true
  );
  const showAddToLibrary =
    !!remoteLibraryHandle?.addTracksToRemoteLibrary && hasUnaddedTracks;
  const showRemoveFromLibrary =
    !!remoteLibraryHandle?.removeTracksFromRemoteLibrary && !hasUnaddedTracks;

  const addToPlaylist = (playlistId: string) => {
    const newItems: PlaylistItem[] = tracksForActions
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
              addToPlaylist(item.id);
            }}
          >
            {item.name}
          </Item>
        );
      }
    });
  };

  const artists = [
    ...normalizeArtists(
      menuData?.metadata?.artist,
      menuData?.metadata?.artistUri,
      menuData?.metadata?.source,
      delimiter
    ),
    ...normalizeArtists(
      menuData?.metadata?.albumArtist,
      menuData?.metadata?.albumArtistUri,
      menuData?.metadata?.source,
      delimiter
    )
  ];
  const uniqueArtists = Array.from(
    new Map(artists.map((artist) => [artist.id, artist])).values()
  );
  const goToArtists = uniqueArtists.filter(
    (artist) =>
      !(visibleView == View.Artist && artist.id == visibleSelectedGroup)
  );

  const showGoToAlbum =
    visibleView != View.Album ||
    menuData?.metadata?.albumId != visibleSelectedGroup;
  const showGoToArtist = goToArtists.length > 0;

  function goToArtist(id: string) {
    dispatch(push(BASEPATH + `artist/${encodeURIComponent(id)}`));
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
            addToPlaylist(newPlaylistId);
          }}
        >
          {t("tracks.addToNewPlaylist")}
        </Item>
        <Separator />
        {renderFolderContent(items)}
      </>
    );
  };

  const renderCustomActions = () => {
    if (!menuData?.metadata) return null;
    const pluginHandle = pluginHandles[menuData.metadata.source];
    if (!pluginHandle?.getCustomTrackActions) return null;
    const customActions = pluginHandle.getCustomTrackActions(menuData.metadata);
    if (!customActions.length) return null;

    return (
      <>
        <Separator />
        {customActions.map((action, index) => (
          <Item
            key={index}
            disabled={action.disabled}
            onClick={() => {
              if (menuData?.metadata && !action.disabled) {
                action.onClick(menuData.metadata);
                hideAll();
              }
            }}
          >
            {action.label}
          </Item>
        ))}
      </>
    );
  };

  return (
    <>
      {showGoToAlbum && (
        <>
          <Item
            onClick={() => {
              if (menuData?.metadata?.albumId == undefined) return;
              dispatch(
                push(
                  BASEPATH +
                    `album/${encodeURIComponent(menuData.metadata.albumId)}`
                )
              );
              hideAll();
            }}
          >
            {t("tracks.goToAlbum")}
          </Item>
        </>
      )}
      {showGoToArtist ? (
        uniqueArtists.length > 1 ? (
          <Submenu label={t("tracks.goToArtist")}>
            {goToArtists.map((artist) => (
              <Item onClick={() => goToArtist(artist.id)} key={artist.id}>
                {artist.name}
              </Item>
            ))}
          </Submenu>
        ) : (
          <Item onClick={() => goToArtist(goToArtists[0].id)}>
            {t("tracks.goToArtist")}
          </Item>
        )
      ) : null}
      {(showGoToAlbum || showGoToArtist) && <Separator />}
      <Item
        onClick={() => {
          dispatch(
            addTracksToUpNext({
              dropIndex: 0,
              tracks: tracksForActions.map((track) => ({
                trackId: track.trackId,
                itemId: nanoid()
              }))
            })
          );
          if (tracksForActions.length == 1) {
            showToast(
              t("toasts.addedNamedTrackToQueueFront", {
                title: menuData?.metadata?.title
              })
            );
          } else {
            showToast(
              t("toasts.addedTracksToQueueFront", {
                count: tracksForActions.length
              })
            );
          }
        }}
      >
        {t("tracks.playNext")}
      </Item>
      <Item
        onClick={() => {
          dispatch(
            addTracksToUpNext({
              tracks: tracksForActions.map((track) => ({
                trackId: track.trackId,
                itemId: nanoid()
              }))
            })
          );
          if (tracksForActions.length == 1) {
            showToast(
              t("toasts.addedNamedTrackToQueue", {
                title: menuData?.metadata?.title
              })
            );
          } else {
            showToast(
              t("toasts.addedTracksToQueue", {
                count: tracksForActions.length
              })
            );
          }
        }}
      >
        {t("tracks.addToQueue")}
      </Item>
      <Separator />
      <Submenu label={t("tracks.addToPlaylist")}>
        {renderItems(playlists)}
      </Submenu>
      {showAddToLibrary || showRemoveFromLibrary ? <Separator /> : null}
      {showAddToLibrary && (
        <Item
          onClick={async () => {
            hideAll();
            await remoteLibraryHandle?.addTracksToRemoteLibrary?.(
              tracksForActions.map((track) => track.uri)
            );
            if (tracksForActions.length == 1) {
              showToast(
                t("toasts.addedNamedTrackToRemoteLibrary", {
                  title: menuData?.metadata?.title,
                  source: sourceDisplayName!
                })
              );
            } else {
              showToast(
                t("toasts.addedTracksToRemoteLibrary", {
                  count: tracksForActions.length,
                  source: sourceDisplayName!
                })
              );
            }
            const now = Date.now();
            dispatch(
              addTracks({
                source: sourceForActions!,
                tracks: tracksForActions.map(
                  (track) =>
                    ({
                      ...track,
                      dateAdded: now
                    }) as TrackMetadata
                ),
                addToLibrary: true
              })
            );
          }}
        >
          {t("tracks.addToRemoteLibrary", {
            source: sourceDisplayName
          })}
        </Item>
      )}
      {showRemoveFromLibrary && (
        <Item
          onClick={async () => {
            hideAll();
            await remoteLibraryHandle?.removeTracksFromRemoteLibrary?.(
              tracksForActions.map((track) => track.uri)
            );
            if (tracksForActions.length == 1) {
              showToast(
                t("toasts.removedNamedTrackFromRemoteLibrary", {
                  title: menuData?.metadata?.title,
                  source: sourceDisplayName!
                })
              );
            } else {
              showToast(
                t("toasts.removedTracksFromRemoteLibrary", {
                  count: tracksForActions.length,
                  source: sourceDisplayName!
                })
              );
            }
            dispatch(
              removeTracks({
                source: sourceForActions!,
                tracks: tracksForActions.map((track) => track.trackId),
                removeFromLibrary: true
              })
            );
          }}
        >
          {t("tracks.removeFromRemoteLibrary", { source: sourceDisplayName })}
        </Item>
      )}
      {renderCustomActions()}
    </>
  );
}
