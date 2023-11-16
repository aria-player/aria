import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { Themes } from "../../themes/themes";
import { isTauri } from "../../app/utils";
import { selectTheme, setTheme } from "../../features/config/configSlice";
import styles from "./settings.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";

export function AppearancePage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const { platform, decorations, setDecorations } = useContext(PlatformContext);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value));
  };

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDecorations(event.target.checked);
  };

  return (
    <div>
      <h4 className={styles.header}>{t("settings.appearance.theme")}</h4>
      <select
        className={styles.select}
        value={currentTheme}
        onChange={handleThemeChange}
      >
        {Object.values(Themes).map((theme) => (
          <option key={theme.id} value={theme.id}>
            {theme.label}
          </option>
        ))}
      </select>
      {isTauri() && platform == Platform.Windows && (
        <div>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={decorations ?? false}
            onChange={handleCheckboxChange}
          />
          {t("settings.appearance.windowsControls")}
        </div>
      )}
    </div>
  );
}
