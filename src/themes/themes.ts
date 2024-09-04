export interface Theme {
  label: string;
  base?: "light" | "dark";
  stylesheet?: string;
  disableAccentPicker?: boolean;
}

export const stylesheets: Record<string, { default: string }> =
  import.meta.glob("./*/*.css", {
    query: "?inline",
    eager: true
  });

export const themes: Record<string, Theme> = {
  system: { label: "System" }
};

const themeManifests = import.meta.glob("./*/theme.json", { eager: true });
for (const path in themeManifests) {
  const themeData = themeManifests[path] as { default: Theme };
  themes[path.split("/")[1]] = themeData.default;
}

export const accentColors: Record<string, string> = {
  blue: "#338fe1",
  teal: "#099268",
  green: "#2f9e44",
  lime: "#66a80f",
  yellow: "#f08c00",
  orange: "#e8590c",
  red: "#e03131",
  pink: "#c2255c",
  grape: "#9c36b5",
  violet: "#6741d9",
  indigo: "#3b5bdb",
  gray: "#495057"
};
