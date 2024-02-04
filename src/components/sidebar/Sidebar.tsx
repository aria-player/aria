import styles from "./Sidebar.module.css";
import { isTauri } from "../../app/utils";
import { MenuButton } from "../MenuButton";
import { useTranslation } from "react-i18next";
import { SectionTree } from "soprano-ui";
import { useRef } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  moveLibraryItem,
  selectLibraryLayout
} from "../../features/library/librarySlice";
import {
  movePlaylistItem,
  selectPlaylistsLayout
} from "../../features/playlists/playlistsSlice";
import { useContextMenu } from "react-contexify";

import FolderOpenIcon from "../../assets/chevron-down-solid.svg?react";
import FolderClosedIcon from "../../assets/chevron-right-solid.svg?react";
import OptionsButtonIcon from "../../assets/ellipsis-solid.svg?react";
import DoneButtonIcon from "../../assets/check-solid.svg?react";

export function Sidebar() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const sectionTreeRef = useRef(null);
  const libraryLayout = useAppSelector(selectLibraryLayout);
  const playlistsLayout = useAppSelector(selectPlaylistsLayout);
  const { show, hideAll } = useContextMenu();

  const sections = [
    {
      id: "library",
      name: "Library",
      emptyMessage: "No views enabled",
      children: libraryLayout
    },
    {
      id: "playlists",
      name: "Playlists",
      emptyMessage: "No playlists",
      children: playlistsLayout
    }
  ];

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
        placeholder={t("nav.search")}
      />
      <SectionTree
        ref={sectionTreeRef}
        sections={sections}
        FolderOpenIcon={() => <FolderOpenIcon />}
        FolderClosedIcon={() => <FolderClosedIcon />}
        OptionsButtonIcon={() => <OptionsButtonIcon />}
        DoneButtonIcon={() => <DoneButtonIcon />}
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
      />
    </div>
  );
}
