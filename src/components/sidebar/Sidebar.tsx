import styles from "./Sidebar.module.css";
import { isTauri } from "../../app/utils";
import { MenuButton } from "../MenuButton";
import { useTranslation } from "react-i18next";
import { SectionTree } from "soprano-ui";
import { useRef } from "react";

export function Sidebar() {
  const { t } = useTranslation();
  const sectionTreeRef = useRef(null);
  const sections = [
    {
      id: "views",
      name: "Library",
      emptyMessage: "No views enabled",
      children: []
    },
    {
      id: "playlists",
      name: "Playlists",
      emptyMessage: "No playlists",
      children: []
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
        FolderOpenIcon={() => <div>V</div>}
        FolderClosedIcon={() => <div>&gt;</div>}
        OptionsButtonIcon={() => <div>*</div>}
        DoneButtonIcon={() => <div>!</div>}
        sections={sections}
      />
    </div>
  );
}
