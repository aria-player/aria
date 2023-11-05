import { goBack, goForward, push } from "redux-first-history";
import { AppDispatch, RootState } from "./store";
import { invoke } from "@tauri-apps/api";
import { createSelector } from "@reduxjs/toolkit";
import { BASEPATH } from "./constants";

export interface MenuItem {
  id: string;
  label?: string;
  shortcut?: string;
  submenu?: MenuItem[];
  maconly?: boolean;
  winlinuxonly?: boolean;
}

export interface MenuItemState {
  disabled?: boolean;
  selected?: boolean;
}

export async function handleMenuAction(dispatch: AppDispatch, action: string) {
  switch (action) {
    case "exit":
      invoke("exit");
      break;
    case "settings":
      dispatch(push(BASEPATH + "settings"));
      break;
    case "back":
      dispatch(goBack());
      break;
    case "forward":
      dispatch(goForward());
      break;
    case "about":
      dispatch(push(BASEPATH + "settings/about"));
      break;
    case "fullscreen":
      invoke("toggle_fullscreen");
      break;
    default:
      break;
  }
}

export const selectMenuState = createSelector(
  [(state: RootState) => state.router],
  () => {
    return {
      back: {
        disabled: !(window.history.length > 1 && window.history.state.idx > 0)
      },
      forward: {
        disabled: !(
          window.history.length > 1 &&
          window.history.length - 1 != window.history.state.idx
        )
      }
    };
  }
);
