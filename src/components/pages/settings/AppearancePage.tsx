import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { accentColors, defaultThemes } from "../../../themes/themes";
import { colorIsDark, getStringIfFirst, isTauri } from "../../../app/utils";
import {
  installThemesFromFiles,
  removeTheme,
  selectAccentColor,
  selectCustomAccentColor,
  selectStylesheets,
  selectTheme,
  selectThemes,
  setAccentColor,
  setCustomAccentColor,
  setTheme
} from "../../../features/config/configSlice";
import styles from "./settings.module.css";
import { useContext, useState } from "react";
import { Platform, PlatformContext } from "../../../contexts/PlatformContext";
import { useTranslation } from "react-i18next";
import ThemePreview from "./ThemePreview";
import RemoveIcon from "../../../assets/trash-can-solid.svg?react";
import { ColorPicker, IColor, useColor } from "react-color-palette";
import GearIcon from "../../../assets/gear-solid.svg?react";

export function AppearancePage() {
  const { t } = useTranslation();

  const dispatch = useAppDispatch();
  const currentTheme = useAppSelector(selectTheme);
  const accentColor = useAppSelector(selectAccentColor);
  const customAccentColor = useAppSelector(selectCustomAccentColor);
  const themes = useAppSelector(selectThemes);
  const stylesheets = useAppSelector(selectStylesheets);
  const { platform, decorations, setDecorations } = useContext(PlatformContext);
  const [showAccentPicker, setShowAccentPicker] = useState(false);
  const [localCustomAccentColor, setLocalCustomAccentColor] =
    useColor(customAccentColor);

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

  const handleCustomAccentChange = (color: IColor) => {
    if (!themes[currentTheme]?.disableAccentPicker) {
      setLocalCustomAccentColor(color);
      document.documentElement.style.setProperty("--accent-color", color.hex);
      document.documentElement.style.setProperty(
        "--button-text-selected",
        colorIsDark(color.hex) ? "#fff" : "#000"
      );
    }
  };

  const handleCustomAccentChangeComplete = (color: IColor) => {
    dispatch(setCustomAccentColor(color.hex));
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
              className={`${styles.accentButton} ${accentColor === color ? styles.selected : ""}`}
              onClick={() => {
                accentsEnabled ? handleAccentChange(color) : null;
              }}
              disabled={!accentsEnabled}
            ></button>
          ))}
          <button
            key="custom"
            title={t("settings.appearance.customAccent")}
            style={{
              backgroundColor: localCustomAccentColor.hex,
              color: colorIsDark(localCustomAccentColor.hex) ? "#fff" : "#000"
            }}
            className={`${styles.accentButton} ${accentColor === "custom" ? styles.selected : ""}`}
            onClick={() => {
              setShowAccentPicker(!showAccentPicker);
            }}
            disabled={!accentsEnabled}
          >
            <GearIcon />
          </button>
        </div>
        {showAccentPicker && (
          <div
            className={styles.accentPicker}
            onMouseDown={() => {
              if (accentColor != "custom") {
                dispatch(setAccentColor("custom"));
              }
            }}
          >
            <ColorPicker
              height={160}
              color={localCustomAccentColor}
              onChange={handleCustomAccentChange}
              onChangeComplete={handleCustomAccentChangeComplete}
              hideAlpha
            />
          </div>
        )}
      </section>
    </div>
  );
}
