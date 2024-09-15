import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import {
  selectAccentColor,
  selectCustomAccentColor,
  selectStylesheets,
  selectTheme,
  selectThemes
} from "../features/config/configSlice";
import { colorIsDark } from "../app/utils";
import { accentColors } from "../themes/themes";

export const useTheme = () => {
  const theme = useAppSelector(selectTheme);
  const themes = useAppSelector(selectThemes);
  const stylesheets = useAppSelector(selectStylesheets);
  const accentColor = useAppSelector(selectAccentColor);
  const customAccentColor = useAppSelector(selectCustomAccentColor);
  const accentColorHex =
    accentColor == "custom"
      ? customAccentColor
      : accentColors[accentColor] || accentColors["blue"];

  useEffect(() => {
    if (themes[theme]?.disableAccentPicker) {
      document.documentElement.style.removeProperty("--accent-color");
      document.documentElement.style.removeProperty("--button-text-selected");
    } else {
      document.documentElement.style.setProperty(
        "--accent-color",
        accentColorHex
      );
      document.documentElement.style.setProperty(
        "--button-text-selected",
        colorIsDark(accentColorHex) ? "#fff" : "#000"
      );
    }
  }, [themes, theme, accentColorHex]);

  useEffect(() => {
    const loadTheme = (selectedTheme: string) => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      const systemColorScheme = prefersDark.matches ? "dark" : "light";
      const computedTheme =
        selectedTheme === "system" ? systemColorScheme : selectedTheme;
      const stylesheet = stylesheets[computedTheme];
      if (stylesheet) {
        const style =
          document.getElementById("theme") || document.createElement("style");
        style.id = "theme";
        style.textContent = stylesheet;
        document.head.appendChild(style);
      }
      const themeColorScheme = themes[computedTheme]?.base;
      document.documentElement.style.colorScheme =
        themeColorScheme || systemColorScheme;
    };

    loadTheme(theme);
    if (theme !== "system" && themes[theme]?.base) return;
    const handleSystemChange = () => {
      loadTheme(theme);
    };

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    prefersDark.addEventListener("change", handleSystemChange);
    return () => {
      prefersDark.removeEventListener("change", handleSystemChange);
    };
  }, [stylesheets, theme, themes]);
};
