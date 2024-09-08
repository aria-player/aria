import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { accentColors, defaultThemes } from "../../../themes/themes";
import { getStringIfFirst, isTauri } from "../../../app/utils";
import {
  installThemesFromFiles,
  removeTheme,
  selectAccentColor,
  selectStylesheets,
  selectTheme,
  selectThemes,
  setAccentColor,
  setTheme
} from "../../../features/config/configSlice";
import styles from "./settings.module.css";
import { useContext } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";
import ThemePreview from "./ThemePreview";
import RemoveIcon from "../../../assets/trash-can-solid.svg?react";

export function AppearancePage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const currentAccentColor = useAppSelector(selectAccentColor);
  const themes = useAppSelector(selectThemes);
  const stylesheets = useAppSelector(selectStylesheets);
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

  const handleThemeChange = (theme: string) => {
    dispatch(setTheme(theme));
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
        <div className={styles.themeContainer}>
          {Object.keys(themes).map((theme) => (
            <div key={theme} className={styles.themeItem}>
              <button
                className={`${styles.themeButton} ${theme == currentTheme ? styles.selected : ""}`}
                onClick={() => handleThemeChange(theme)}
              >
                {theme == "system" ? (
                  <div className={styles.splitTheme}>
                    <ThemePreview stylesheet={stylesheets["light"]} />
                    <ThemePreview stylesheet={stylesheets["dark"]} />
                  </div>
                ) : (
                  <ThemePreview stylesheet={stylesheets[theme]} />
                )}
                <p>{themes[theme].label}</p>
              </button>
              {!Object.keys(defaultThemes).includes(theme) && (
                <button
                  onClick={async () => {
                    const confirmed = await confirm(
                      t("settings.appearance.confirmDelete", {
                        theme: themes[theme].label
                      })
                    );
                    if (!confirmed) return;
                    dispatch(removeTheme(theme));
                  }}
                  className={`${styles.removeButton} ${theme == currentTheme ? styles.selected : ""}`}
                >
                  <RemoveIcon />
                </button>
              )}
            </div>
          ))}
        </div>
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
