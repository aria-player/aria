import { goBack, goForward, push } from "redux-first-history";
import { AppDispatch } from "./store";
import { appWindow } from "@tauri-apps/api/window";

export const menus = [
  {
    id: "menubar_file",
    label: "File",
    submenu: [
      {
        id: "menubar_file_settings",
        label: "Settings..."
      },
      {
        id: "menubar_file_exit",
        label: "Exit",
        tauri: true
      }
    ]
  },
  {
    id: "menubar_edit",
    label: "Edit",
    submenu: []
  },
  {
    id: "menubar_view",
    label: "View",
    submenu: []
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
    id: "menubar_help",
    label: "Help",
    submenu: []
  }
];

export async function handleMenuAction(dispatch: AppDispatch, action: string) {
  switch (action) {
    case "menubar_file_exit":
      await appWindow.close();
      break;
    case "menubar_file_settings":
      dispatch(push("settings"));
      break;
    case "menubar_navigate_back":
      dispatch(goBack());
      break;
    case "menubar_navigate_forward":
      dispatch(goForward());
      break;
    default:
      break;
  }
}
