export interface Theme {
  label: string;
  base?: "light" | "dark";
}

export const Themes: Record<string, Theme> = {
  system: { label: "System (default)" },
  light: { label: "Light", base: "light" },
  dark: { label: "Dark", base: "dark" },
  midnight: { label: "Midnight", base: "dark" }
};
