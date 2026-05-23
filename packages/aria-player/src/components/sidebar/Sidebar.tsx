import styles from "./Sidebar.module.css";
import {
  isTauri,
  parseExternalPlaylistId,
  getExternalPlaylistId,
} from "../../app/utils";
import { useTranslation } from "react-i18next";
import { SectionTree, findTreeNode, useContextMenu } from "soprano-ui";
import type { Item as TreeItem, MenuItem as SopranoMenuItem } from "soprano-ui";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import {
  moveLibraryItem,
  resetLibraryLayout,
  selectLibraryLayout,
  updateLibraryItem,
} from "../../features/library/librarySlice";
import {
  movePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem,
  upsertExternalPlaylist,
  selectPlaylistsLayout,
  selectOpenFolders,
  openPlaylistFolder,
  closePlaylistFolder,
  updatePlaylistItem,
  selectPlaylistById,
} from "../../features/playlists/playlistsSlice";
import { setQueueToNewSource } from "../../features/player/playerSlice";
import { selectSortedTrackList } from "../../features/genericSelectors";
import { useMenuActions } from "../../hooks/useMenuActions";
import { store } from "../../app/store";
import { push, replace } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { useDragDropManager } from "react-dnd";
import {
  selectVisibleViewType,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleSearchSource,
} from "../../features/visibleSelectors";
import { View } from "../../app/view";
import {
  selectDebouncedSearch,
  selectSelectedSearchCategory,
  selectSelectedSearchSource,
  selectSearch,
  setSearch,
  setDebouncedSearch,
} from "../../features/search/searchSlice";

import FolderOpenIcon from "../../assets/chevron-down-solid.svg?react";
import FolderClosedIcon from "../../assets/chevron-right-solid.svg?react";
import OptionsButtonIcon from "../../assets/ellipsis-solid.svg?react";
import DoneButtonIcon from "../../assets/check-solid.svg?react";
import ClearIcon from "../../assets/xmark-solid.svg?react";
import { useLocation } from "react-router-dom";
import { TreeContext } from "../../contexts/TreeContext";
import { SidebarMenu } from "./SidebarMenu";
import {
  getExternalPlaylistsHandle,
  selectActivePlugins,
  selectPluginInfo,
} from "../../features/plugins/pluginsSlice";
import {
  startPlaylistOperation,
  finishPlaylistOperation,
  selectPendingPlaylistOperations,
  selectSlowPlaylistOperations,
} from "../../features/playlists/playlistsSlice";
import { showToast } from "../../app/toasts";

const SEARCH_DEBOUNCE_MS = 180;

function annotatePlaylistOperations(
  items: TreeItem[],
  ops: Partial<Record<string, unknown>>
): TreeItem[] {
  return items.map((item) => ({
    ...item,
    loading: ops[item.id] != null,
    ...(item.children && {
      children: annotatePlaylistOperations(item.children, ops),
    }),
  }));
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void } = {}) {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const showContextMenu = useContextMenu();
  const { t } = useTranslation();
  const treeRef = useContext(TreeContext)?.treeRef;
  const libraryLayout = useAppSelector(selectLibraryLayout);
  const playlistsLayout = useAppSelector(selectPlaylistsLayout);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const selectedSearchCategory = useAppSelector(selectSelectedSearchCategory);
  const selectedSearchSource = useAppSelector(selectSelectedSearchSource);
  const search = useAppSelector(selectSearch);
  const debouncedSearch = useAppSelector(selectDebouncedSearch);
  const pendingPlaylistOperations = useAppSelector(
    selectPendingPlaylistOperations
  );
  const slowPlaylistOperations = useAppSelector(selectSlowPlaylistOperations);
  const [isComposing, setIsComposing] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);
  const searchFocusedRef = useRef(false);
  if (prevSearch !== search) {
    setPrevSearch(search);
    setLocalSearch(search);
  }

  useEffect(() => {
    if (visibleViewType !== View.Search) return;
    if (searchFocusedRef.current) return;
    const pathParts = location.pathname.substring(BASEPATH.length).split("/");
    const searchQueryFromRoute =
      pathParts.length > 1 ? decodeURIComponent(pathParts[1]) : "";
    setLocalSearch(searchQueryFromRoute);
    dispatch(setSearch(searchQueryFromRoute));
  }, [dispatch, location.pathname, visibleViewType]);

  const activePlugins = useAppSelector(selectActivePlugins);
  const pluginInfo = useAppSelector(selectPluginInfo);
  const [refreshingProviders, setRefreshingProviders] = useState<
    Partial<Record<string, true>>
  >({});
  const { invokeMenuAction } = useMenuActions();
  const dragDropManager = useDragDropManager();
  const [scrollY, setScrollY] = useState(0);
  const playlistsLayoutWithOperations = useMemo(
    () => annotatePlaylistOperations(playlistsLayout, slowPlaylistOperations),
    [playlistsLayout, slowPlaylistOperations]
  );
  const sections = [
    {
      id: "library",
      name: t("sidebar.library.title"),
      emptyMessage: t("sidebar.library.empty"),
      children: libraryLayout.map((item) => ({
        ...item,
        name: t("views." + item.id),
      })),
    },
    {
      id: "playlists",
      name: t("sidebar.playlists.title"),
      emptyMessage: t("sidebar.playlists.empty"),
      children: playlistsLayoutWithOperations,
    },
  ];

  useEffect(() => {
    const initialOpenState = selectOpenFolders(store.getState());
    for (const item of initialOpenState) {
      treeRef?.current?.root.tree.open(item);
    }
  }, [treeRef]);

  function syncSelectionWithRoute(alwaysUpdateSelection: boolean) {
    const routeAsId = visiblePlaylist?.id || visibleViewType;
    if (treeRef?.current?.root.tree.get(routeAsId) || alwaysUpdateSelection) {
      treeRef?.current?.root.tree.setSelection({
        ids: [routeAsId],
        anchor: null,
        mostRecent: null,
      });
    }
  }

  useEffect(() => {
    const routeAsId = visiblePlaylist?.id || visibleViewType;
    treeRef?.current?.root.tree.setSelection({
      ids: [routeAsId],
      anchor: null,
      mostRecent: null,
    });
  }, [treeRef, visiblePlaylist, visibleViewType]);

  useEffect(() => {
    if (debouncedSearch === search) {
      return;
    }
    const timer = setTimeout(() => {
      dispatch(setDebouncedSearch(search));
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search, dispatch, debouncedSearch]);

  useEffect(() => {
    if (visibleViewType !== View.Search || isComposing) return;
    if (debouncedSearch !== search) return;
    const source = visibleSearchSource ?? selectedSearchSource ?? "library";
    const searchCategory =
      visibleSearchCategory === undefined
        ? selectedSearchCategory
        : visibleSearchCategory;
    const nextPath = debouncedSearch.trim()
      ? BASEPATH +
        `search/${encodeURIComponent(debouncedSearch)}/${encodeURIComponent(source)}${searchCategory ? `/${searchCategory}` : ""}`
      : BASEPATH + "search";
    if (location.pathname !== nextPath) {
      dispatch(replace(nextPath));
    }
  }, [
    debouncedSearch,
    dispatch,
    isComposing,
    location.pathname,
    selectedSearchCategory,
    selectedSearchSource,
    visibleSearchCategory,
    visibleSearchSource,
    visibleViewType,
    search,
  ]);

  function goToSearch(searchValue: string) {
    if (visibleViewType != View.Search) {
      dispatch(push(BASEPATH + getSearchRoute(searchValue)));
    }
  }

  function getSearchRoute(search: string) {
    const source = visibleSearchSource ?? selectedSearchSource ?? "library";
    const searchCategory =
      visibleSearchCategory === undefined
        ? selectedSearchCategory
        : visibleSearchCategory;
    if (!search.trim()) {
      return "search";
    }
    return `search/${encodeURIComponent(search)}/${encodeURIComponent(source)}${searchCategory ? `/${searchCategory}` : ""}`;
  }

  const isFolder = (itemId: string) => {
    return (
      findTreeNode(selectPlaylistsLayout(store.getState()), itemId)
        ?.children !== undefined
    );
  };

  function buildLibraryMenuItems(): SopranoMenuItem[] {
    const isEditing = !!treeRef?.current?.visibilityEditing;
    return [
      {
        label: isEditing
          ? t("sidebar.library.menu.save")
          : t("sidebar.library.menu.edit"),
        onSelect: () => {
          if (isEditing) {
            treeRef?.current?.setVisibilityEditing(null);
          } else {
            treeRef?.current?.setVisibilityEditing("library");
          }
        },
      },
      { type: "separator" },
      {
        label: t("sidebar.library.menu.reset"),
        onSelect: () => dispatch(resetLibraryLayout()),
      },
    ];
  }

  function buildPlaylistsHeaderMenuItems(): SopranoMenuItem[] {
    const externalPlaylistProviders = activePlugins
      .filter((pluginId) =>
        pluginInfo[pluginId]?.capabilities?.includes("externalPlaylists")
      )
      .map((pluginId) => ({
        id: pluginId,
        name: pluginInfo[pluginId].name,
        handle: getExternalPlaylistsHandle(pluginId),
      }));
    const creatableProviders = externalPlaylistProviders.filter(
      (p) => p.handle?.createPlaylist != null
    );
    const refreshableProviders = externalPlaylistProviders.filter(
      (p) => p.handle?.refreshPlaylists != null
    );

    const items: SopranoMenuItem[] = [
      {
        label: t("sidebar.playlists.menu.addPlaylist"),
        onSelect: () => {
          const newId = nanoid();
          dispatch(
            createPlaylistItem({
              newData: {
                id: newId,
                name: t("sidebar.playlists.defaultPlaylist"),
              },
            })
          );
          treeRef?.current?.root.tree.edit(newId);
        },
      },
      {
        label: t("sidebar.playlists.menu.addFolder"),
        onSelect: () => {
          const newId = nanoid();
          dispatch(
            createPlaylistItem({
              newData: {
                id: newId,
                name: t("sidebar.playlists.defaultFolder"),
                children: [],
              },
            })
          );
          treeRef?.current?.root.tree.edit(newId);
        },
      },
    ];

    if (creatableProviders.length > 0 || refreshableProviders.length > 0) {
      items.push({ type: "separator" });
    }

    for (const provider of creatableProviders) {
      items.push({
        label: t("sidebar.playlists.menu.addExternalPlaylist", {
          provider: provider.name,
        }),
        onSelect: async () => {
          const defaultName = t("sidebar.playlists.defaultPlaylist");
          try {
            const rawId = await provider.handle!.createPlaylist!(defaultName);
            const newId = getExternalPlaylistId(provider.id, rawId);
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
        },
      });
    }

    if (creatableProviders.length > 0 && refreshableProviders.length > 0) {
      items.push({ type: "separator" });
    }

    for (const provider of refreshableProviders) {
      items.push({
        label: t("sidebar.playlists.menu.refreshExternalPlaylists", {
          provider: provider.name,
        }),
        disabled: refreshingProviders[provider.id] === true,
        onSelect: async () => {
          if (
            !provider.handle?.refreshPlaylists ||
            refreshingProviders[provider.id]
          ) {
            return;
          }
          setRefreshingProviders((prev) => ({ ...prev, [provider.id]: true }));
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
            setRefreshingProviders((prev) => {
              const updated = { ...prev };
              delete updated[provider.id];
              return updated;
            });
          }
        },
      });
    }

    return items;
  }

  function buildSidebarItemMenuItems(itemId: string): SopranoMenuItem[] {
    const state = store.getState();
    const item = findTreeNode(selectPlaylistsLayout(state), itemId) ?? null;
    const playlist = selectPlaylistById(state, itemId);
    const plugin = playlist?.provider
      ? getExternalPlaylistsHandle(playlist.provider)
      : undefined;
    const isOperationPending = pendingPlaylistOperations[itemId] != null;
    const isExternalPlaylist = playlist?.provider != null;
    const canRename =
      !isExternalPlaylist ||
      (plugin?.renamePlaylist != null && playlist?.permissions === "manage");
    const canDelete =
      !isExternalPlaylist ||
      (plugin?.deletePlaylist != null && playlist?.permissions === "manage");
    const customPlaylistActions = plugin?.getCustomPlaylistActions
      ? plugin.getCustomPlaylistActions(itemId, playlist?.permissions ?? "read")
      : [];

    const items: SopranoMenuItem[] = [];

    if (item?.children != undefined) {
      items.push(
        {
          label: t("sidebar.playlists.menu.addPlaylist"),
          onSelect: () => {
            dispatch(openPlaylistFolder({ id: itemId }));
            treeRef?.current?.root.tree.open(itemId);
            const newId = nanoid();
            dispatch(
              createPlaylistItem({
                newData: {
                  id: newId,
                  name: t("sidebar.playlists.defaultPlaylist"),
                },
                parentId: itemId,
              })
            );
            treeRef?.current?.root.tree.edit(newId);
          },
        },
        {
          label: t("sidebar.playlists.menu.addFolder"),
          onSelect: () => {
            dispatch(openPlaylistFolder({ id: itemId }));
            treeRef?.current?.root.tree.open(itemId);
            const newId = nanoid();
            dispatch(
              createPlaylistItem({
                newData: {
                  id: newId,
                  name: t("sidebar.playlists.defaultFolder"),
                  children: [],
                },
                parentId: itemId,
              })
            );
            treeRef?.current?.root.tree.edit(newId);
          },
        },
        { type: "separator" }
      );
    } else {
      items.push(
        {
          label: t("sidebar.playlists.menu.play"),
          onSelect: () => {
            const queue = selectSortedTrackList(
              store.getState(),
              View.Playlist,
              itemId
            );
            if (!queue.length) return;
            dispatch(
              setQueueToNewSource({
                queue,
                queueSource: "playlist/" + itemId,
                queueIndex: 0,
                queueGrouping: null,
                queueSelectedGroup: null,
              })
            );
          },
        },
        { type: "separator" }
      );
    }

    items.push(
      {
        label: t("sidebar.playlists.menu.rename"),
        disabled: !canRename || isOperationPending,
        onSelect: () => treeRef?.current?.root.tree.edit(itemId),
      },
      {
        label: t("sidebar.playlists.menu.delete"),
        disabled: !canDelete || isOperationPending,
        onSelect: async () => {
          if (!item) return;
          if (isExternalPlaylist) {
            const confirmed = confirm(
              t("sidebar.playlists.menu.confirmDeleteExternal", {
                name: item.name,
                provider:
                  pluginInfo[playlist!.provider!]?.name ?? playlist!.provider,
              })
            );
            if (!confirmed) return;
            dispatch(startPlaylistOperation(itemId, "delete"));
            try {
              await plugin!.deletePlaylist!(
                parseExternalPlaylistId(itemId)?.rawId ?? itemId
              );
              dispatch(deletePlaylistItem({ id: itemId, isFolder: false }));
              showToast(
                t("toasts.deletedExternalPlaylistItem", {
                  name: item.name,
                  provider:
                    pluginInfo[playlist!.provider!]?.name ?? playlist!.provider,
                })
              );
            } catch (error) {
              console.error("Failed to delete external playlist:", error);
              showToast(
                t("toasts.deleteExternalPlaylistError", { name: item.name })
              );
            } finally {
              dispatch(finishPlaylistOperation(itemId));
            }
            return;
          }
          if ((item.children?.length ?? 0) > 0) {
            const confirmed = confirm(
              t("sidebar.playlists.menu.confirmDelete")
            );
            if (confirmed) {
              dispatch(deletePlaylistItem({ id: itemId, isFolder: true }));
              showToast(t("toasts.deletedPlaylistItem", { name: item.name }));
            }
          } else {
            dispatch(
              deletePlaylistItem({
                id: itemId,
                isFolder: item.children != undefined,
              })
            );
            showToast(t("toasts.deletedPlaylistItem", { name: item.name }));
          }
        },
      }
    );

    if (customPlaylistActions.length > 0) {
      items.push({ type: "separator" });
      for (const action of customPlaylistActions) {
        items.push({
          label: action.label,
          disabled: action.disabled || isOperationPending,
          onSelect: () => action.onClick(itemId),
        });
      }
    }

    return items;
  }

  return (
    <div className={`sidebar ${styles.sideBar}`}>
      {!isTauri() && (
        <div className={styles.webMenu}>
          <SidebarMenu />
        </div>
      )}
      <div
        className={`search-bar ${styles.search} ${scrollY > 0 ? styles.border : ""}`}
      >
        <input
          className={`${styles.searchInput} ${visibleViewType == View.Search ? styles.searchSelected : ""}`}
          type="text"
          value={localSearch}
          placeholder={t("sidebar.search")}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key == "Enter" && !isComposing) goToSearch(localSearch);
          }}
          onCompositionStart={() => {
            setIsComposing(true);
          }}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            const inputValue = (e.target as HTMLInputElement).value;
            setLocalSearch(inputValue);
            dispatch(setSearch(inputValue));
            goToSearch(inputValue);
          }}
          onFocus={() => {
            searchFocusedRef.current = true;
          }}
          onChange={(e) => {
            const inputValue = (e.target as HTMLInputElement).value;
            setLocalSearch(inputValue);
            dispatch(setSearch(inputValue));
            if (!isComposing) {
              goToSearch(inputValue);
            }
          }}
          onClick={() => {
            goToSearch(localSearch);
          }}
          onBlur={(e) => {
            if (
              (e.relatedTarget as HTMLElement)?.role == "treeitem" &&
              (
                e.nativeEvent as FocusEvent & {
                  sourceCapabilities?: { firesTouchEvents?: boolean };
                }
              )?.sourceCapabilities === null
            ) {
              e.target.focus();
            } else {
              searchFocusedRef.current = false;
            }
          }}
        />
        {search && (
          <button
            className={styles.searchClear}
            title={t("search.clear")}
            onClick={() => {
              setLocalSearch("");
              dispatch(setSearch(""));
              dispatch(setDebouncedSearch(""));
              if (visibleViewType == View.Search) {
                dispatch(push(BASEPATH + "search"));
              }
            }}
          >
            <ClearIcon />
          </button>
        )}
      </div>
      <SectionTree
        ref={treeRef}
        sections={sections}
        dndManager={dragDropManager}
        FolderOpenIcon={() => <FolderOpenIcon />}
        FolderClosedIcon={() => <FolderClosedIcon />}
        OptionsButtonIcon={() => <OptionsButtonIcon />}
        DoneButtonIcon={() => <DoneButtonIcon />}
        optionsButtonTooltip={t("sidebar.options")}
        doneButtonTooltip={t("sidebar.library.menu.save")}
        onSectionContextMenu={(section, event) => {
          if (section === "library") {
            showContextMenu(event, buildLibraryMenuItems());
          } else if (section === "playlists") {
            showContextMenu(event, buildPlaylistsHeaderMenuItems());
          }
        }}
        onEmptySpaceContextMenu={(event) => {
          showContextMenu(event, buildPlaylistsHeaderMenuItems());
        }}
        onMoveWithinSection={(args) => {
          const action =
            args.sectionId === "library" ? moveLibraryItem : movePlaylistItem;
          dispatch(
            action({
              id: args.movedItemId,
              parentId: args.newParentId,
              index: args.newIndex,
              isFolder: isFolder(args.movedItemId),
            })
          );
        }}
        onRenameWithinSection={async (sectionId, itemId, newName) => {
          if (sectionId !== "playlists") return;
          const playlistItem = findTreeNode(
            selectPlaylistsLayout(store.getState()),
            itemId
          );
          if (!playlistItem || playlistItem.name === newName) return;

          const isPlaylistFolder = playlistItem.children !== undefined;
          const playlist = selectPlaylistById(store.getState(), itemId);
          if (!playlist?.provider) {
            dispatch(
              updatePlaylistItem({
                id: itemId,
                changes: { name: newName },
                isFolder: isPlaylistFolder,
              })
            );
            return;
          }

          const plugin = getExternalPlaylistsHandle(playlist.provider);
          if (!plugin?.renamePlaylist || pendingPlaylistOperations[itemId]) {
            return;
          }

          dispatch(
            updatePlaylistItem({
              id: itemId,
              changes: { name: newName },
              isFolder: false,
            })
          );
          dispatch(startPlaylistOperation(itemId, "rename"));
          try {
            await plugin.renamePlaylist(
              parseExternalPlaylistId(itemId)?.rawId ?? itemId,
              newName
            );
          } catch (error) {
            dispatch(
              updatePlaylistItem({
                id: itemId,
                changes: { name: playlistItem.name },
                isFolder: false,
              })
            );
            console.error("Failed to rename external playlist:", error);
            showToast(
              t("toasts.renameExternalPlaylistError", {
                name: playlistItem.name,
              })
            );
          } finally {
            dispatch(finishPlaylistOperation(itemId));
          }
        }}
        onOptionsMenuActiveChange={(section, button, event) => {
          if (section != null && event != null) {
            const rect = button?.getBoundingClientRect();
            const pos = {
              clientX: rect?.left ?? event.clientX,
              clientY: rect?.bottom ?? event.clientY,
            };
            const items =
              section === "library"
                ? buildLibraryMenuItems()
                : buildPlaylistsHeaderMenuItems();
            showContextMenu(pos, items, {
              onClose: () => treeRef?.current?.setOptionsMenuActive(null),
            });
          }
        }}
        onItemVisibilityChange={(_, itemId, hidden) => {
          dispatch(updateLibraryItem({ id: itemId, changes: { hidden } }));
        }}
        onItemContextMenu={(section, itemId, event) => {
          if (section === "library") {
            showContextMenu(event, buildLibraryMenuItems());
          } else {
            showContextMenu(event, buildSidebarItemMenuItems(itemId));
          }
        }}
        onRowKeyDown={(e) => {
          if (e.key === " ") {
            invokeMenuAction("togglePlay");
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onFolderAction={(_, itemId, open) => {
          const action = open ? openPlaylistFolder : closePlaylistFolder;
          dispatch(action({ id: itemId }));
        }}
        onSelect={(nodes) => {
          if (!nodes[0]?.id) {
            syncSelectionWithRoute(false);
          }
        }}
        onSelectedItemChange={(section, itemId) => {
          if (!itemId) return;
          if (section == "library") {
            dispatch(push(BASEPATH + itemId));
          } else {
            dispatch(push(BASEPATH + "playlist/" + itemId));
          }
          onNavigate?.();
        }}
        onScroll={(e) => {
          setScrollY(e.scrollOffset);
        }}
      />
    </div>
  );
}
