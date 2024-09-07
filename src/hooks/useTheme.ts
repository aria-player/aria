import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import {
  selectAccentColor,
  selectStylesheets,
  selectTheme,
  selectThemes
} from "../features/config/configSlice";
import { accentColors } from "../themes/themes";

export const useTheme = () => {
  const theme = useAppSelector(selectTheme);
  const themes = useAppSelector(selectThemes);
  const stylesheets = useAppSelector(selectStylesheets);
  const accentColor = useAppSelector(selectAccentColor);

  useEffect(() => {
    if (themes[theme]?.disableAccentPicker) {
      document.documentElement.style.removeProperty("--accent-color");
    } else {
      document.documentElement.style.setProperty(
        "--accent-color",
        accentColors[accentColor] || accentColors["blue"]
      );
    }
  }, [themes, theme, accentColor]);

  useEffect(() => {
    const loadTheme = (selectedTheme: string) => {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
      const systemColorScheme = prefersDark.matches ? "dark" : "light";
      const computedTheme =
        selectedTheme === "system" ? systemColorScheme : selectedTheme;
      const stylesheet =
        stylesheets[`./${computedTheme}/${themes[computedTheme]?.stylesheet}`];
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
