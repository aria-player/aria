import styles from "./Sidebar.module.css";
import { isTauri } from "../../app/utils";
import { MenuButton } from "../appmenu/MenuButton";
import { useTranslation } from "react-i18next";
import { SectionTree, findTreeNode } from "soprano-ui";
import { useCallback, useContext, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  moveLibraryItem,
  selectLibraryLayout,
  updateLibraryItem
} from "../../features/library/librarySlice";
import {
  movePlaylistItem,
  selectPlaylistsLayout,
  selectOpenFolders,
  openPlaylistFolder,
  closePlaylistFolder,
  updatePlaylistItem
} from "../../features/playlists/playlistsSlice";
import { useContextMenu } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { useMenuActions } from "../../hooks/useMenuActions";
import { store } from "../../app/store";
import { push, replace } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { useDragDropManager } from "react-dnd";
import {
  selectVisibleViewType,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleSearchSource
} from "../../features/visibleSelectors";
import { View } from "../../app/view";
import { selectSearch, setSearch } from "../../features/search/searchSlice";

import FolderOpenIcon from "../../assets/chevron-down-solid.svg?react";
import FolderClosedIcon from "../../assets/chevron-right-solid.svg?react";
import OptionsButtonIcon from "../../assets/ellipsis-solid.svg?react";
import DoneButtonIcon from "../../assets/check-solid.svg?react";
import ClearIcon from "../../assets/xmark-solid.svg?react";
import { useLocation } from "react-router-dom";
import { TreeContext } from "../../contexts/TreeContext";

export function Sidebar() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { t } = useTranslation();
  const treeRef = useContext(TreeContext)?.treeRef;
  const libraryLayout = useAppSelector(selectLibraryLayout);
  const playlistsLayout = useAppSelector(selectPlaylistsLayout);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const search = useAppSelector(selectSearch);
  const [isComposing, setIsComposing] = useState(false);
  const [localSearch, setLocalSearch] = useState(search);

  useEffect(() => {
    const pathParts = location.pathname.substring(BASEPATH.length).split("/");
    const searchQueryFromRoute =
      visibleViewType == View.Search && pathParts.length > 1
        ? decodeURIComponent(pathParts[1])
        : "";
    if (search != searchQueryFromRoute && visibleViewType == View.Search) {
      dispatch(setSearch(searchQueryFromRoute));
    }
  }, [dispatch, location, search, visibleViewType]);

  const { show, hideAll } = useContextMenu();
  const { visibility, setMenuData } = useContext(MenuContext);
  const { invokeMenuAction } = useMenuActions();
  const dragDropManager = useDragDropManager();
  const sections = [
    {
      id: "library",
      name: t("sidebar.library.title"),
      emptyMessage: t("sidebar.library.empty"),
      children: libraryLayout.map((item) => ({
        ...item,
        name: t("views." + item.id)
      }))
    },
    {
      id: "playlists",
      name: t("sidebar.playlists.title"),
      emptyMessage: t("sidebar.playlists.empty"),
      children: playlistsLayout
    }
  ];

  useEffect(() => {
    if (
      visibility["sidebarlibrary"] === false &&
      visibility["sidebarplaylists"] === false &&
      treeRef?.current?.optionsMenuActive != null
    ) {
      treeRef?.current?.setOptionsMenuActive(null);
    }
  }, [visibility, treeRef]);

  useEffect(() => {
    const initialOpenState = selectOpenFolders(store.getState());
    for (const item of initialOpenState) {
      treeRef?.current?.root.tree.open(item);
    }
  }, [treeRef]);

  const syncSelectionWithRoute = useCallback(
    (alwaysUpdateSelection: boolean) => {
      const routeAsId = visiblePlaylist?.id || visibleViewType;
      if (treeRef?.current?.root.tree.get(routeAsId) || alwaysUpdateSelection) {
        treeRef?.current?.root.tree.setSelection({
          ids: [routeAsId],
          anchor: null,
          mostRecent: null
        });
      }
    },
    [treeRef, visiblePlaylist, visibleViewType]
  );

  useEffect(() => {
    syncSelectionWithRoute(true);
  }, [syncSelectionWithRoute, treeRef, visiblePlaylist, visibleViewType]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  function goToSearch() {
    if (visibleViewType != View.Search || visibleSearchCategory != null) {
      dispatch(push(BASEPATH + getSearchRoute(localSearch)));
    }
  }

  function getSearchRoute(search: string) {
    const source = visibleSearchSource ?? "library";
    if (!search.trim()) {
      return "search";
    }
    return `search/${encodeURIComponent(search)}/${encodeURIComponent(source)}${visibleSearchCategory ? `/${visibleSearchCategory}` : ""}`;
  }

  const isFolder = (itemId: string) => {
    return (
      findTreeNode(selectPlaylistsLayout(store.getState()), itemId)
        ?.children !== undefined
    );
  };

  return (
    <div className={`sidebar ${styles.sideBar}`}>
      {!isTauri() && (
        <div className={styles.webMenu}>
          <MenuButton />
        </div>
      )}
      <div className={`search-bar ${styles.search}`}>
        <input
          className={`${styles.searchInput} ${visibleViewType == View.Search ? styles.searchSelected : ""}`}
          type="text"
          value={localSearch}
          placeholder={t("sidebar.search")}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key == "Enter" && !isComposing) goToSearch();
          }}
          onCompositionStart={() => {
            setIsComposing(true);
          }}
          onCompositionEnd={(e) => {
            setIsComposing(false);
            goToSearch();
            dispatch(
              replace(
                BASEPATH + getSearchRoute((e.target as HTMLInputElement).value)
              )
            );
          }}
          onChange={(e) => {
            setLocalSearch((e.target as HTMLInputElement).value);
            if (!isComposing) {
              goToSearch();
              dispatch(
                replace(
                  BASEPATH +
                    getSearchRoute((e.target as HTMLInputElement).value)
                )
              );
            }
          }}
          onClick={() => {
            goToSearch();
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
            }
          }}
        />
        {search && (
          <button
            className={styles.searchClear}
            title={t("search.clear")}
            onClick={() => {
              setLocalSearch("");
              dispatch(push(BASEPATH + "search"));
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
          if (section != null) {
            show({ id: "sidebar" + section, event });
          } else {
            hideAll();
          }
        }}
        onEmptySpaceContextMenu={(event) => {
          show({ id: "sidebarplaylists", event });
        }}
        onMoveWithinSection={(args) => {
          const action =
            args.sectionId === "library" ? moveLibraryItem : movePlaylistItem;
          dispatch(
            action({
              id: args.movedItemId,
              parentId: args.newParentId,
              index: args.newIndex,
              isFolder: isFolder(args.movedItemId)
            })
          );
        }}
        onRenameWithinSection={(_, itemId, newName) => {
          if (
            findTreeNode(selectPlaylistsLayout(store.getState()), itemId)
              ?.name != newName
          )
            dispatch(
              updatePlaylistItem({
                id: itemId,
                changes: { name: newName },
                isFolder: isFolder(itemId)
              })
            );
        }}
        onOptionsMenuActiveChange={(section, button, event) => {
          if (section != null && event != null) {
            const buttonPosition = button?.getBoundingClientRect();
            const menuId = "sidebar" + section;
            show({
              id: menuId,
              event,
              position: {
                x: buttonPosition?.left ?? 0,
                y: buttonPosition?.bottom ?? 0
              }
            });
          } else {
            hideAll();
          }
        }}
        onItemVisibilityChange={(_, itemId, hidden) => {
          dispatch(updateLibraryItem({ id: itemId, changes: { hidden } }));
        }}
        onItemContextMenu={(section, itemId, event) => {
          if (section == "library") {
            show({ id: "sidebarlibrary", event });
          } else {
            setMenuData({ itemId, type: "sidebaritem" });
            show({ id: "sidebaritem", event });
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
        }}
      />
    </div>
  );
}
