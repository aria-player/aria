import { goBack, goForward, push } from "redux-first-history";
import { AppDispatch, RootState } from "./store";
import { invoke } from "@tauri-apps/api";
import { createSelector } from "@reduxjs/toolkit";

export interface MenuItem {
  id: string;
  label: string;
  shortcut?: string;
  submenu?: MenuItem[];
  tauri?: boolean;
}

export interface MenuItemState {
  disabled?: boolean;
  selected?: boolean;
}

export async function handleMenuAction(dispatch: AppDispatch, action: string) {
  switch (action) {
    case "menubar_file_exit":
      invoke("close");
      break;
    case "menubar_file_settings":
      dispatch(push("/settings"));
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

export const selectMenuState = createSelector(
  [(state: RootState) => state.router],
  () => {
    return {
      menubar_navigate_back: {
        disabled: !(window.history.length > 1 && window.history.state.idx > 0)
      },
      menubar_navigate_forward: {
        disabled: !(
          window.history.length > 1 &&
          window.history.length - 1 != window.history.state.idx
        )
      }
    };
  }
);
