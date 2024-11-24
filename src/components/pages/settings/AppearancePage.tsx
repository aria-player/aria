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
import { useContext, useEffect, useRef, useState } from "react";
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
  const accentPickerRef = useRef<HTMLDivElement>(null);
  const showAccentPickerButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        accentPickerRef.current &&
        !accentPickerRef.current.contains(target) &&
        showAccentPickerButtonRef.current &&
        !showAccentPickerButtonRef.current.contains(target)
      ) {
        setShowAccentPicker(false);
      }
    };
    if (showAccentPicker) {
      document.addEventListener("mousedown", handleMouseDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [showAccentPicker]);

  const showThemeFilePicker = async () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".zip";
      input.multiple = true;
      input.style.display = "none";
      input.onchange = (event) => {
        const files = (event.target as HTMLInputElement).files;
        if (files) {
          dispatch(installThemesFromFiles(Array.from(files)));
        }
      };
      document.body.appendChild(input);
      input.click();
      document.body.removeChild(input);
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
      <h3 className={styles.title}>{t("settings.sections.appearance")}</h3>
      <p>{t("settings.appearance.subtitle")}</p>
      <hr className={styles.separator} />
      <section className="settings-section">
        <h4 className="settings-heading">{t("settings.appearance.theme")}</h4>
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
          <button className="settings-button" onClick={showThemeFilePicker}>
            {t("settings.appearance.installFromFile")}
          </button>
        </p>
      </section>
      {isTauri() && platform == Platform.Windows && (
        <section className="settings-section">
          <h4 className="settings-heading">
            {t("settings.appearance.window")}
          </h4>
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
      <section className="settings-section">
        <h4
          className={`settings-heading ${!accentsEnabled ? styles.disabledSection : ""}`}
        >
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
                if (accentsEnabled) {
                  handleAccentChange(color);
                }
              }}
              disabled={!accentsEnabled}
            ></button>
          ))}
          <button
            ref={showAccentPickerButtonRef}
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
            ref={accentPickerRef}
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
