import { useTranslation } from "react-i18next";
import styles from "./SettingsPage.module.css";
import { Outlet } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { selectVisibleSettingsSection } from "../../features/visibleSelectors";
import { SettingsSection } from "../../app/view";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const visibleSettingsSection = useAppSelector(selectVisibleSettingsSection);

  return (
    <div className={styles.settings}>
      <div className={styles.links}>
        {Object.values(SettingsSection).map((section) => (
          <button
            key={section}
            className={`${styles.link} ${visibleSettingsSection == section ? styles.selected : ""}`}
            onClick={() =>
              dispatch(
                push(
                  BASEPATH +
                    "settings" +
                    (section == SettingsSection.General ? "" : "/" + section)
                )
              )
            }
          >
            {t(`settings.sections.${section}`)}
          </button>
        ))}
      </div>
      <div className={styles.outlet}>
        <Outlet />
      </div>
    </div>
  );
}
