import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { AccentColors, Themes } from "../../../themes/themes";
import { isTauri } from "../../../app/utils";
import {
  selectAccentColor,
  selectTheme,
  setAccentColor,
  setTheme
} from "../../../features/config/configSlice";
import styles from "./settings.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";

export function AppearancePage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const currentAccentColor = useAppSelector(selectAccentColor);
  const { platform, decorations, setDecorations } = useContext(PlatformContext);

  const handleThemeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setTheme(event.target.value));
  };

  const handleAccentChange = (color: string) => {
    dispatch(setAccentColor(color));
  };

  const handleCheckboxChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setDecorations(event.target.checked);
  };

  const accentsEnabled = Themes[currentTheme].supportsAccent;

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.appearance")}</h3>
      <p>{t("settings.appearance.subtitle")}</p>
      <hr />
      <h4>{t("settings.appearance.theme")}</h4>
      <select value={currentTheme} onChange={handleThemeChange}>
        {Object.keys(Themes).map((theme) => (
          <option key={theme} value={theme}>
            {Themes[theme as keyof typeof Themes].label}
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
      <h4 className={`${!accentsEnabled ? styles.disabledSection : ""}`}>
        {t("settings.appearance.accent")}
      </h4>
      <div className={styles.accentContainer}>
        {Object.keys(AccentColors).map((color) => (
          <button
            key={color}
            title={t(`accentColors.${color}`)}
            style={{ backgroundColor: AccentColors[color] }}
            className={`${styles.accentButton} ${currentAccentColor === color ? styles.selected : ""}`}
            onClick={() => (accentsEnabled ? handleAccentChange(color) : null)}
            disabled={!accentsEnabled}
          ></button>
        ))}
      </div>
    </div>
  );
}
