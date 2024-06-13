import styles from "./Sidebar.module.css";
import { isTauri } from "../../app/utils";
import { MenuButton } from "../appmenu/MenuButton";
import { useTranslation } from "react-i18next";
import { SectionTree, findTreeNode } from "soprano-ui";
import { useCallback, useContext, useEffect } from "react";
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
import { TreeContext } from "../../contexts/TreeContext";
import { useMenuActions } from "../../hooks/useMenuActions";
import { store } from "../../app/store";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { useDragDropManager } from "react-dnd";
import {
  selectVisibleViewType,
  selectVisiblePlaylist
} from "../../features/visibleSelectors";
import { View } from "../../app/view";
import { setSearch } from "../../features/tracks/tracksSlice";

import FolderOpenIcon from "../../assets/chevron-down-solid.svg?react";
import FolderClosedIcon from "../../assets/chevron-right-solid.svg?react";
import OptionsButtonIcon from "../../assets/ellipsis-solid.svg?react";
import DoneButtonIcon from "../../assets/check-solid.svg?react";

export function Sidebar() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const treeRef = useContext(TreeContext)?.treeRef;
  const libraryLayout = useAppSelector(selectLibraryLayout);
  const playlistsLayout = useAppSelector(selectPlaylistsLayout);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);

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

  function goToSearch() {
    if (visibleViewType != View.Search) dispatch(push(BASEPATH + "search/"));
  }

  return (
    <div className={styles.sideBar}>
      {!isTauri() && (
        <div className={styles.webMenu}>
          <MenuButton />
        </div>
      )}
      <input
        className={styles.search}
        type="text"
        placeholder={t("sidebar.search")}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key == "Enter") goToSearch();
        }}
        onChange={(e) => {
          dispatch(setSearch((e.target as HTMLInputElement).value));
          goToSearch();
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
              index: args.newIndex
            })
          );
        }}
        onRenameWithinSection={(_, itemId, newName) => {
          if (
            findTreeNode(selectPlaylistsLayout(store.getState()), itemId)
              ?.name != newName
          )
            dispatch(
              updatePlaylistItem({ id: itemId, changes: { name: newName } })
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
            if (itemId === "songs") {
              dispatch(push(BASEPATH));
            } else {
              dispatch(push(BASEPATH + itemId));
            }
          } else {
            dispatch(push(BASEPATH + "playlist/" + itemId));
          }
        }}
      />
    </div>
  );
}
