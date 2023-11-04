import { isTauri } from "../../app/utils";
import styles from "./AppearancePage.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";

export function GeneralPage() {
  const { t, i18n } = useTranslation();
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
    i18n.changeLanguage(event.target.value);
  };

  return (
    <div>
      <h4 className={styles.header}>{t("settings.general.general")}</h4>
      {isTauri() && platform != Platform.Mac && (
        <div>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={minimiseToTray ?? false}
            onChange={handleCheckboxChange}
          />
          {t("settings.general.minimiseToTray")}
        </div>
      )}
      <select onChange={handleLanguageChange} defaultValue="">
        <option value="" disabled>
          {t("settings.general.selectLanguage")}
        </option>
        <option value="en-US">English (United States)</option>
        <option value="en-GB">English (United Kingdom)</option>
      </select>
    </div>
  );
}
