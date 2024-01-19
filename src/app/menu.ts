import { AppDispatch, RootState } from "./store";
import { createSelector } from "@reduxjs/toolkit";
import { invoke } from "@tauri-apps/api";
import { push, goBack, goForward } from "redux-first-history";
import { BASEPATH } from "./constants";
import { AgGridReact } from "@ag-grid-community/react";

export interface MenuItem {
  id: string;
  shortcut?: string;
  submenu?: MenuItem[];
  maconly?: boolean;
  winlinuxonly?: boolean;
}

export interface MenuItemState {
  disabled?: boolean;
  selected?: boolean;
}

export function handleMenuAction(
  action: string,
  dispatch: AppDispatch,
  grid?: AgGridReact | null
) {
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
    case "select_all":
      grid?.api?.selectAll();
      break;
    default:
      break;
  }
}

export const selectMenuState = createSelector(
  [(state: RootState) => state.router],
  (state) => {
    return {
      back: {
        disabled: !(window.history.length > 1 && window.history.state.idx > 0)
      },
      forward: {
        disabled: !(
          window.history.length > 1 &&
          window.history.length - 1 != window.history.state.idx
        )
      },
      select_all: {
        disabled: state.location?.pathname != BASEPATH
      }
    };
  }
);
