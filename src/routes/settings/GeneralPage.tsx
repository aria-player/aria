import { isTauri } from "../../app/utils";
import styles from "./settings.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";
import { supportedLanguages } from "../../i18n";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectLanguage, setLanguage } from "../../features/config/configSlice";

export function GeneralPage() {
  const { t, i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const language = useAppSelector(selectLanguage);
  const { platform, minimiseToTray, setMinimiseToTray } =
    useContext(PlatformContext);

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setMinimiseToTray(event.target.checked);
  };

  const handleLanguageChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    if (event.target.value === "default") {
      i18n.changeLanguage(window.navigator.language);
      dispatch(setLanguage(null));
      return;
    }
    i18n.changeLanguage(event.target.value);
    dispatch(setLanguage(event.target.value));
  };

  return (
    <div>
      <h4 className={styles.header}>{t("settings.general.language")}</h4>
      <select
        className={styles.select}
        onChange={handleLanguageChange}
        defaultValue={language}
      >
        <option value="default">{t("settings.general.defaultLanguage")}</option>
        {Object.entries(supportedLanguages).map(([langCode, { title }]) => (
          <option key={langCode} value={langCode}>
            {title}
          </option>
        ))}
      </select>
      {isTauri() && platform != Platform.Mac && (
        <>
          <h4 className={styles.header}>{t("settings.general.behaviour")}</h4>
          <div>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={minimiseToTray ?? false}
              onChange={handleCheckboxChange}
            />
            {t("settings.general.minimiseToTray")}
          </div>
        </>
      )}
    </div>
  );
}
