import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAccentColor, selectTheme } from "../features/config/configSlice";
import { AccentColors, stylesheets, themes } from "../themes/themes";

export const useTheme = () => {
  const theme = useAppSelector(selectTheme);
  const accentColor = useAppSelector(selectAccentColor);

  useEffect(() => {
    if (!themes[theme]?.supportsAccent) return;
    document.documentElement.style.setProperty(
      "--accent-color",
      AccentColors[accentColor] || AccentColors["blue"]
    );
  }, [theme, accentColor]);

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
      style.textContent = stylesheet.default;
      document.head.appendChild(style);
    }
    const themeColorScheme = themes[computedTheme]?.base;
    document.documentElement.style.colorScheme =
      themeColorScheme || systemColorScheme;
  };

  useEffect(() => {
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
  }, [theme]);
};
