import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import type { MenuItem as SopranoMenuItem } from "soprano-ui";
import { Item as TreeItem } from "soprano-ui";
import { t } from "i18next";
import { nanoid } from "@reduxjs/toolkit";
import {
  addPlaylistTracksThunk,
  createPlaylistItem,
  selectPlaylistById,
  selectPlaylistsLayout,
  upsertExternalPlaylist,
} from "../features/playlists/playlistsSlice";
import { addTracks, removeTracks } from "../features/tracks/tracksSlice";
import { addTracksToUpNext } from "../features/player/playerSlice";
import {
  selectVisibleViewType,
  selectVisibleSelectedTrackGroup,
} from "../features/visibleSelectors";
import { push } from "redux-first-history";
import { BASEPATH } from "../app/constants";
import { showToast } from "../app/toasts";
import {
  getExternalPlaylistsHandle,
  pluginHandles,
  selectActivePlugins,
  selectPluginInfo,
} from "../features/plugins/pluginsSlice";
import { getExternalPlaylistId, normalizeArtists } from "../app/utils";
import { selectArtistDelimiter } from "../features/config/configSlice";
import { Track } from "../../../types/tracks";
import { store } from "../app/store";
import { View } from "../app/view";

function buildPlaylistSubItems(
  treeItems: TreeItem[],
  sourceForActions: string | undefined,
  addToPlaylist: (id: string) => void,
  canCreateExternalPlaylist: boolean,
  externalPlaylistsHandle: ReturnType<typeof getExternalPlaylistsHandle>,
  sourceDisplayName: string | null,
  parentId?: string
): SopranoMenuItem[] {
  const items: SopranoMenuItem[] = [
    {
      label: t("tracks.addToNewPlaylist"),
      onSelect: () => {
        const newId = nanoid();
        store.dispatch(
          createPlaylistItem({
            newData: {
              id: newId,
              name: t("sidebar.playlists.defaultPlaylist"),
            },
            parentId,
          })
        );
        addToPlaylist(newId);
      },
    },
  ];

  if (parentId == undefined && canCreateExternalPlaylist) {
    items.push({
      label: t("tracks.addToNewExternalPlaylist", {
        provider: sourceDisplayName,
      }),
      onSelect: async () => {
        const defaultName = t("sidebar.playlists.defaultPlaylist");
        try {
          const rawId =
            await externalPlaylistsHandle!.createPlaylist!(defaultName);
          const newId = getExternalPlaylistId(sourceForActions!, rawId);
          store.dispatch(
            upsertExternalPlaylist({
              id: newId,
              name: defaultName,
              provider: sourceForActions!,
              permissions: "manage",
            })
          );
          addToPlaylist(newId);
        } catch (error) {
          console.error("Couldn't create external playlist:", error);
          showToast(t("toasts.createExternalPlaylistError"));
        }
      },
    });
  }

  items.push({ type: "separator" });

  if (!treeItems.length) {
    items.push({ label: t("tracks.noItems"), disabled: true });
    return items;
  }

  for (const item of treeItems) {
    if (item.children) {
      items.push({
        type: "submenu",
        label: item.name,
        items: buildPlaylistSubItems(
          item.children,
          sourceForActions,
          addToPlaylist,
          canCreateExternalPlaylist,
          externalPlaylistsHandle,
          sourceDisplayName,
          item.id
        ),
      });
    } else {
      const playlist = selectPlaylistById(store.getState(), item.id);
      const isDisabled =
        !!playlist?.provider &&
        (playlist.provider !== sourceForActions ||
          !pluginHandles[playlist.provider]?.addPlaylistTracks ||
          (playlist.permissions !== "write" &&
            playlist.permissions !== "manage"));
      items.push({
        label: item.name,
        disabled: isDisabled,
        onSelect: () => addToPlaylist(item.id),
      });
    }
  }

  return items;
}

export function useTrackMenuItems() {
  const dispatch = useAppDispatch();
  const playlists = useAppSelector(selectPlaylistsLayout);
  const visibleView = useAppSelector(selectVisibleViewType);
  const visibleSelectedGroup = useAppSelector(selectVisibleSelectedTrackGroup);
  const delimiter = useAppSelector(selectArtistDelimiter);
  const pluginInfo = useAppSelector(selectPluginInfo);
  const activePlugins = useAppSelector(selectActivePlugins);

  return useCallback(
    (tracksForActions: Track[], clickedTrack?: Track): SopranoMenuItem[] => {
      const trackForNav = clickedTrack ?? tracksForActions[0];
      const sourceForActions = tracksForActions[0]?.source;
      const allSameSource = tracksForActions.every(
        (t) => t.source === sourceForActions
      );

      const remoteLibraryHandle =
        sourceForActions && allSameSource
          ? pluginHandles[sourceForActions]
          : null;
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
        !!remoteLibraryHandle?.removeTracksFromRemoteLibrary &&
        !hasUnaddedTracks;

      const externalPlaylistsHandle =
        sourceForActions &&
        allSameSource &&
        activePlugins.includes(sourceForActions) &&
        pluginInfo[sourceForActions]?.capabilities?.includes(
          "externalPlaylists"
        )
          ? getExternalPlaylistsHandle(sourceForActions)
          : null;
      const canCreateExternalPlaylist =
        !!externalPlaylistsHandle?.createPlaylist &&
        !!externalPlaylistsHandle?.addPlaylistTracks;

      const artists = [
        ...normalizeArtists(
          trackForNav?.artist,
          trackForNav?.artistUri,
          trackForNav?.source,
          delimiter
        ),
        ...normalizeArtists(
          trackForNav?.albumArtist,
          trackForNav?.albumArtistUri,
          trackForNav?.source,
          delimiter
        ),
      ];
      const uniqueArtists = Array.from(
        new Map(artists.map((a) => [a.id, a])).values()
      );
      const goToArtists = uniqueArtists.filter(
        (artist) =>
          !(visibleView == View.Artist && artist.id == visibleSelectedGroup)
      );
      const showGoToAlbum =
        visibleView != View.Album ||
        trackForNav?.albumId != visibleSelectedGroup;
      const showGoToArtist = goToArtists.length > 0;

      const addToPlaylist = (playlistId: string) => {
        dispatch(
          addPlaylistTracksThunk(
            playlistId,
            tracksForActions.map((track) => track.trackId)
          )
        );
      };

      const items: SopranoMenuItem[] = [];

      if (showGoToAlbum) {
        items.push({
          label: t("tracks.goToAlbum"),
          onSelect: () => {
            if (!trackForNav?.albumId) return;
            dispatch(
              push(
                BASEPATH + `album/${encodeURIComponent(trackForNav.albumId)}`
              )
            );
          },
        });
      }

      if (showGoToArtist) {
        if (uniqueArtists.length > 1) {
          items.push({
            type: "submenu",
            label: t("tracks.goToArtist"),
            items: goToArtists.map((artist) => ({
              label: artist.name,
              onSelect: () =>
                dispatch(
                  push(BASEPATH + `artist/${encodeURIComponent(artist.id)}`)
                ),
            })),
          });
        } else {
          items.push({
            label: t("tracks.goToArtist"),
            onSelect: () =>
              dispatch(
                push(
                  BASEPATH + `artist/${encodeURIComponent(goToArtists[0].id)}`
                )
              ),
          });
        }
      }

      if (showGoToAlbum || showGoToArtist) {
        items.push({ type: "separator" });
      }

      items.push({
        label: t("tracks.playNext"),
        onSelect: () => {
          dispatch(
            addTracksToUpNext({
              dropIndex: 0,
              tracks: tracksForActions.map((track) => ({
                trackId: track.trackId,
                itemId: nanoid(),
              })),
            })
          );
          if (tracksForActions.length == 1) {
            showToast(
              t("toasts.addedNamedTrackToQueueFront", {
                title: trackForNav?.title,
              })
            );
          } else {
            showToast(
              t("toasts.addedTracksToQueueFront", {
                count: tracksForActions.length,
              })
            );
          }
        },
      });

      items.push({
        label: t("tracks.addToQueue"),
        onSelect: () => {
          dispatch(
            addTracksToUpNext({
              tracks: tracksForActions.map((track) => ({
                trackId: track.trackId,
                itemId: nanoid(),
              })),
            })
          );
          if (tracksForActions.length == 1) {
            showToast(
              t("toasts.addedNamedTrackToQueue", { title: trackForNav?.title })
            );
          } else {
            showToast(
              t("toasts.addedTracksToQueue", { count: tracksForActions.length })
            );
          }
        },
      });

      items.push({ type: "separator" });

      items.push({
        type: "submenu",
        label: t("tracks.addToPlaylist"),
        items: buildPlaylistSubItems(
          playlists,
          sourceForActions,
          addToPlaylist,
          canCreateExternalPlaylist,
          externalPlaylistsHandle ?? undefined,
          sourceDisplayName
        ),
      });

      if (showAddToLibrary || showRemoveFromLibrary) {
        items.push({ type: "separator" });
      }

      if (showAddToLibrary) {
        items.push({
          label: t("tracks.addToRemoteLibrary", { source: sourceDisplayName }),
          onSelect: async () => {
            await remoteLibraryHandle?.addTracksToRemoteLibrary?.(
              tracksForActions.map((track) => track.uri)
            );
            if (tracksForActions.length == 1) {
              showToast(
                t("toasts.addedNamedTrackToRemoteLibrary", {
                  title: trackForNav?.title,
                  source: sourceDisplayName!,
                })
              );
            } else {
              showToast(
                t("toasts.addedTracksToRemoteLibrary", {
                  count: tracksForActions.length,
                  source: sourceDisplayName!,
                })
              );
            }
            dispatch(
              addTracks({
                source: sourceForActions!,
                tracks: tracksForActions.map(
                  (track) => ({ ...track, dateAdded: Date.now() }) as Track
                ),
                addToLibrary: true,
              })
            );
          },
        });
      }

      if (showRemoveFromLibrary) {
        items.push({
          label: t("tracks.removeFromRemoteLibrary", {
            source: sourceDisplayName,
          }),
          onSelect: async () => {
            await remoteLibraryHandle?.removeTracksFromRemoteLibrary?.(
              tracksForActions.map((track) => track.uri)
            );
            if (tracksForActions.length == 1) {
              showToast(
                t("toasts.removedNamedTrackFromRemoteLibrary", {
                  title: trackForNav?.title,
                  source: sourceDisplayName!,
                })
              );
            } else {
              showToast(
                t("toasts.removedTracksFromRemoteLibrary", {
                  count: tracksForActions.length,
                  source: sourceDisplayName!,
                })
              );
            }
            dispatch(
              removeTracks({
                source: sourceForActions!,
                tracks: tracksForActions.map((track) => track.trackId),
                removeFromLibrary: true,
              })
            );
          },
        });
      }

      if (trackForNav) {
        const pluginHandle = pluginHandles[trackForNav.source];
        if (pluginHandle?.getCustomTrackActions) {
          const customActions = pluginHandle.getCustomTrackActions(trackForNav);
          if (customActions.length) {
            items.push({ type: "separator" });
            for (const action of customActions) {
              items.push({
                label: action.label,
                disabled: action.disabled,
                onSelect: () => {
                  if (!action.disabled) action.onClick(trackForNav);
                },
              });
            }
          }
        }
      }

      return items;
    },
    [
      dispatch,
      playlists,
      visibleView,
      visibleSelectedGroup,
      delimiter,
      pluginInfo,
      activePlugins,
    ]
  );
}
