import { getStringIfFirst, isTauri } from "../../../app/utils";
import styles from "./settings.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectInitialView,
  selectLanguage,
  setInitialView,
  setLanguage,
  setLastView
} from "../../../features/config/configSlice";
import { invoke } from "@tauri-apps/api";
import { LibraryView } from "../../../app/view";

export function GeneralPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);
  const { platform, minimiseToTray, setMinimiseToTray } =
    useContext(PlatformContext);
  const initialView = useAppSelector(selectInitialView);

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMinimiseToTray(event.target.checked);
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    let newLanguage = event.target.value;
    if (event.target.value === "default") {
      newLanguage = window.navigator.language;
      dispatch(setLanguage(null));
    } else {
      dispatch(setLanguage(newLanguage));
    }
    i18n.changeLanguage(newLanguage);
    if (isTauri()) {
      invoke("update_app_config", {
        configItem: "language",
        newValue: newLanguage
      });
    }
  };

  const handleInitialViewChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    dispatch(setInitialView(event.target.value as LibraryView | "continue"));
    dispatch(setLastView(location.pathname));
  };

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.general")}</h3>
      <p>{t("settings.general.subtitle")}</p>
      <hr />
      <section>
        <h4>{t("settings.general.language")}</h4>
        <select
          onChange={handleLanguageChange}
          defaultValue={language ?? "default"}
        >
          <option value="default">
            {t("settings.general.defaultLanguage") +
              " " +
              t("settings.default")}
          </option>
          {Object.entries(supportedLanguages).map(([langCode, { title }]) => (
            <option key={langCode} value={langCode}>
              {title}
            </option>
          ))}
        </select>
      </section>
      {isTauri() && (
        <section>
          <h4>{t("settings.general.initialView")}</h4>
          <div>
            <select
              onChange={handleInitialViewChange}
              defaultValue={initialView}
            >
              {Object.values(LibraryView).map((view, index) => (
                <option key={view} value={view}>
                  {t("views." + view) +
                    getStringIfFirst(" " + t("settings.default"), index)}
                </option>
              ))}
              <option key="continue" value="continue">
                {t("settings.general.continueFromLastView")}
              </option>
            </select>
            <p>{t("settings.general.initialViewLabel")}</p>
          </div>
        </section>
      )}
      {isTauri() && platform != Platform.Mac && (
        <section>
          <h4>{t("settings.general.behaviour")}</h4>
          <div>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={minimiseToTray ?? false}
              onChange={handleCheckboxChange}
            />
            {t("settings.general.minimiseToTray")}
          </div>
        </section>
      )}
    </div>
  );
}
