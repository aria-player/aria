export interface Theme {
  /**
   * Display name for this theme.
   */
  label: string;
  /**
   * Whether to use light/dark default styles for this theme.
   *
   * The `color-scheme` CSS property is set based on this value. If not provided, the app will use the system theme setting for window elements like scrollbars.
   */
  base?: "light" | "dark";
  /**
   * The file name of the theme stylesheet, e.g. `'theme.css'`.
   */
  stylesheet?: string;
  /**
   * Whether to disable the accent color setting while this theme is enabled.
   *
   * If set to `true`, the stylesheet should include two additional CSS variables:
   *
   * - `--accent-color`: the accent color to use while this theme is enabled.
   *
   * - `--button-text-selected`: the text color to use against the accent color.
   */
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
  indigo: "#3b5bdb"
};
