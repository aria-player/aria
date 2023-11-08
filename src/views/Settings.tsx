import { useTranslation } from "react-i18next";
import styles from "./Settings.module.css";
import { NavLink, Outlet } from "react-router-dom";

export default function SettingsPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.settings}>
      <div className={styles.links}>
        <NavLink
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.selected : ""}`
          }
          to={"/settings"}
          end
        >
          {t("settings.sections.general")}
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.selected : ""}`
          }
          to={"appearance"}
        >
          {t("settings.sections.appearance")}
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.selected : ""}`
          }
          to={"about"}
        >
          {t("settings.sections.about")}
        </NavLink>
      </div>
      <div className={styles.outlet}>
        <Outlet />
      </div>
    </div>
  );
}
