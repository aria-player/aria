import { useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { selectAccentColor, selectTheme } from "../features/config/configSlice";
import { AccentColors, Themes } from "../themes/themes";

export const useTheme = () => {
  const theme = useAppSelector(selectTheme);
  const accentColor = useAppSelector(selectAccentColor);

  useEffect(() => {
    if (!Themes[theme]?.supportsAccent) return;
    document.documentElement.style.setProperty(
      "--accent-color",
      AccentColors[accentColor]
    );
  }, [theme, accentColor]);

  useEffect(() => {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const systemColorScheme = prefersDark.matches ? "dark" : "light";
    const computedTheme = theme === "system" ? systemColorScheme : theme;
    const themeColorScheme = Themes[computedTheme]?.base;

    document.body.setAttribute("data-theme", computedTheme);
    document.documentElement.style.colorScheme =
      themeColorScheme || systemColorScheme;
  }, [theme]);

  useEffect(() => {
    if (theme !== "system" && Themes[theme]?.base) return;
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const systemColorScheme = e.matches ? "dark" : "light";
      const computedTheme = theme === "system" ? systemColorScheme : theme;
      document.body.setAttribute("data-theme", computedTheme);
      document.documentElement.style.colorScheme = systemColorScheme;
    };

    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    prefersDark.addEventListener("change", handleSystemChange);
    return () => {
      prefersDark.removeEventListener("change", handleSystemChange);
    };
  }, [theme]);
};
