export interface Theme {
  label: string;
  base?: "light" | "dark";
  supportsAccent?: boolean;
}

export const Themes: Record<string, Theme> = {
  system: { label: "System (default)", supportsAccent: true },
  light: { label: "Light", base: "light", supportsAccent: true },
  dark: { label: "Dark", base: "dark", supportsAccent: true },
  midnight: { label: "Midnight", base: "dark", supportsAccent: true }
};

export const AccentColors: Record<string, string> = {
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
  gray: "#343a40"
};
