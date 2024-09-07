import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { accentColors } from "../../../themes/themes";
import { getStringIfFirst, isTauri } from "../../../app/utils";
import {
  installThemesFromFiles,
  selectAccentColor,
  selectTheme,
  selectThemes,
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
  const themes = useAppSelector(selectThemes);
  const { platform, decorations, setDecorations } = useContext(PlatformContext);

  const showThemeFilePicker = async () => {
    try {
      const fileHandles = await window.showOpenFilePicker({
        types: [
          {
            accept: {
              "application/zip": [".zip"]
            }
          }
        ],
        multiple: true
      });
      dispatch(installThemesFromFiles(fileHandles));
    } catch (error) {
      console.error("Error installing theme:", error);
    }
  };

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

  const accentsEnabled = !themes[currentTheme]?.disableAccentPicker;

  return (
    <div className={styles.page}>
      <h3>{t("settings.sections.appearance")}</h3>
      <p>{t("settings.appearance.subtitle")}</p>
      <hr />
      <section>
        <h4>{t("settings.appearance.theme")}</h4>
        <select value={currentTheme} onChange={handleThemeChange}>
          {Object.keys(themes).map((theme, index) => (
            <option key={theme} value={theme}>
              {themes[theme].label +
                getStringIfFirst(" " + t("settings.default"), index)}
            </option>
          ))}
        </select>
        <p>
          <button onClick={showThemeFilePicker}>
            {t("settings.appearance.installFromFile")}
          </button>
        </p>
      </section>
      {isTauri() && platform == Platform.Windows && (
        <section>
          <h4>{t("settings.appearance.window")}</h4>
          <div>
            <input
              className={styles.checkbox}
              type="checkbox"
              checked={decorations ?? false}
              onChange={handleCheckboxChange}
            />
            {t("settings.appearance.windowsControls")}
          </div>
        </section>
      )}
      <section>
        <h4 className={`${!accentsEnabled ? styles.disabledSection : ""}`}>
          {t("settings.appearance.accent")}
        </h4>
        <div className={styles.accentContainer}>
          {Object.keys(accentColors).map((color, index) => (
            <button
              key={color}
              title={
                t(`accentColors.${color}`) +
                getStringIfFirst(" " + t("settings.default"), index)
              }
              style={{ backgroundColor: accentColors[color] }}
              className={`${styles.accentButton} ${currentAccentColor === color ? styles.selected : ""}`}
              onClick={() =>
                accentsEnabled ? handleAccentChange(color) : null
              }
              disabled={!accentsEnabled}
            ></button>
          ))}
        </div>
      </section>
    </div>
  );
}
