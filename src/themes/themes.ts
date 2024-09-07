export interface Theme {
  label: string;
  base?: "light" | "dark";
  stylesheet?: string;
  disableAccentPicker?: boolean;
}

export const defaultStylesheets: Record<string, string> = {};
export const defaultThemes: Record<string, Theme> = {
  system: { label: "System" }
};

const themeManifests = import.meta.glob("./*/theme.json", { eager: true });
const stylesheets = import.meta.glob("./*/*.css", {
  query: "?inline",
  eager: true
});
const orderedThemes = ["light", "dark", "midnight"];
for (const path of Object.keys(themeManifests).sort((a, b) => {
  const indexA = orderedThemes.indexOf(a.split("/")[1]);
  const indexB = orderedThemes.indexOf(b.split("/")[1]);
  return indexA === -1 ? 1 : indexB === -1 ? -1 : indexA - indexB;
})) {
  const themeId = path.split("/")[1];
  const themeData = themeManifests[path] as { default: Theme };
  const stylesheet = stylesheets[
    `./${themeId}/${themeData.default?.stylesheet}`
  ] as { default: string };
  defaultThemes[themeId] = themeData.default;
  defaultStylesheets[themeId] = stylesheet.default;
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
