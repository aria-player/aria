import styles from "./Sidebar.module.css";
import { isTauri } from "../../app/utils";
import { NavLink } from "react-router-dom";
import { MenuButton } from "../MenuButton";
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const { t } = useTranslation();
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
      <NavLink
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.selected : ""}`
        }
        to="/"
      >
        {t("nav.songs")}
      </NavLink>
      <NavLink
        className={({ isActive }) =>
          `${styles.link} ${isActive ? styles.selected : ""}`
        }
        to="/albums"
      >
        {t("nav.albums")}
      </NavLink>
    </div>
  );
}
