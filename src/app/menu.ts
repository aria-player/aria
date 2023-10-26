import { goBack, goForward } from "redux-first-history";
import { AppDispatch } from "./store";
import { appWindow } from "@tauri-apps/api/window";
import { Theme, setTheme } from "../features/config/configSlice";

export const menus = [
  {
    id: "menubar_file",
    label: "File",
    submenu: [
      {
        id: "menubar_file_exit",
        label: "Exit",
        tauri: true
      }
    ]
  },
  {
    id: "menubar_navigate",
    label: "Navigate",
    submenu: [
      {
        id: "menubar_navigate_back",
        label: "Back",
        shortcut: "Alt+Left"
      },
      {
        id: "menubar_navigate_forward",
        label: "Forward",
        shortcut: "Alt+Right"
      }
    ]
  },
  {
    id: "menubar_view",
    label: "View",
    submenu: [
      {
        id: "menubar_theme",
        label: "Theme",
        submenu: [
          {
            id: "menubar_theme_system",
            label: "System (default)"
          },
          {
            id: "menubar_theme_light",
            label: "Light"
          },
          {
            id: "menubar_theme_dark",
            label: "Dark"
          },
          {
            id: "menubar_theme_midnight",
            label: "Midnight"
          }
        ]
      }
    ]
  }
];

export async function handleMenuAction(dispatch: AppDispatch, action: string) {
  switch (action) {
    case "menubar_file_exit":
      await appWindow.close();
      break;
    case "menubar_navigate_back":
      dispatch(goBack());
      break;
    case "menubar_navigate_forward":
      dispatch(goForward());
      break;
    case "menubar_theme_system":
      dispatch(setTheme(Theme.System));
      break;
    case "menubar_theme_light":
      dispatch(setTheme(Theme.Light));
      break;
    case "menubar_theme_dark":
      dispatch(setTheme(Theme.Dark));
      break;
    case "menubar_theme_midnight":
      dispatch(setTheme(Theme.Midnight));
      break;
    default:
      break;
  }
}
