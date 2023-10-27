import { goBack, goForward, push } from "redux-first-history";
import { AppDispatch } from "./store";
import { appWindow } from "@tauri-apps/api/window";

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
