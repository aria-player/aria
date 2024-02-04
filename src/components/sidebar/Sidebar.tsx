import styles from "./Sidebar.module.css";
import { isTauri } from "../../app/utils";
import { MenuButton } from "../MenuButton";
import { useTranslation } from "react-i18next";
import { SectionTree } from "soprano-ui";
import { useRef } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectLibraryLayout } from "../../features/library/librarySlice";
import { selectPlaylistsLayout } from "../../features/playlists/playlistsSlice";

import FolderOpenIcon from "../../assets/chevron-down-solid.svg?react";
import FolderClosedIcon from "../../assets/chevron-right-solid.svg?react";
import OptionsButtonIcon from "../../assets/ellipsis-solid.svg?react";
import DoneButtonIcon from "../../assets/check-solid.svg?react";

export function Sidebar() {
  const { t } = useTranslation();
  const sectionTreeRef = useRef(null);
  const libraryLayout = useAppSelector(selectLibraryLayout);
  const playlistsLayout = useAppSelector(selectPlaylistsLayout);

  const sections = [
    {
      id: "views",
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
        FolderOpenIcon={() => <FolderOpenIcon />}
        FolderClosedIcon={() => <FolderClosedIcon />}
        OptionsButtonIcon={() => <OptionsButtonIcon />}
        DoneButtonIcon={() => <DoneButtonIcon />}
        sections={sections}
      />
    </div>
  );
}
