import styles from "./Settings.module.css";
import { NavLink, Outlet } from "react-router-dom";

export default function SettingsPage() {
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
          General
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.selected : ""}`
          }
          to={"appearance"}
        >
          Appearance
        </NavLink>
        <NavLink
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.selected : ""}`
          }
          to={"about"}
        >
          About
        </NavLink>
      </div>
      <div className={styles.outlet}>
        <Outlet />
      </div>
    </div>
  );
}
