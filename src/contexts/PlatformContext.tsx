import { invoke } from "@tauri-apps/api";
import { type } from "@tauri-apps/api/os";
import { appWindow } from "@tauri-apps/api/window";
import { ReactNode, createContext, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectMenuState } from "../app/menu";
import { isTauri } from "../app/utils";
import i18n from "../i18n";
import { useMenuActions } from "../hooks/useMenuActions";
import { replace } from "redux-first-history";
import { BASEPATH } from "../app/constants";
import {
  selectInitialView,
  selectLastView,
  setLastView
} from "../features/config/configSlice";
import { store } from "../app/store";
import { useLocation } from "react-router-dom";
import { LibraryView } from "../app/view";

export enum Platform {
  Unknown = "Unknown",
  Web = "Web",
  Windows = "Windows",
  Mac = "Mac",
  Linux = "Linux"
}

export const PlatformContext = createContext<{
  platform: Platform;
  fullscreen: boolean | null;
  decorations: boolean | null;
  minimiseToTray: boolean | null;
  setDecorations: (decorations: boolean) => void;
  setMinimiseToTray: (minimiseToTray: boolean) => void;
}>({
  platform: Platform.Unknown,
  fullscreen: null,
  decorations: null,
  minimiseToTray: null,
  setDecorations: () => {},
  setMinimiseToTray: () => {}
});

export function PlatformProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const menuState = useAppSelector(selectMenuState);
  const { invokeMenuAction } = useMenuActions();
  const location = useLocation();

  const listeningToTauri = useRef(false);
  const [ready, setReady] = useState(false);
  const [platform, setPlatform] = useState<Platform>(Platform.Unknown);
  const [fullscreen, setFullscreen] = useState<boolean | null>(null);
  const [decorations, setDecorations] = useState<boolean | null>(null);
  const [minimiseToTray, setMinimiseToTray] = useState<boolean | null>(null);

  useEffect(() => {
    async function initialise() {
      if (platform !== Platform.Unknown) return;
      if (!isTauri()) {
        setPlatform(Platform.Web);
        return;
      }
      const initialView = selectInitialView(store.getState());
      if (initialView == "continue") {
        dispatch(
          replace(window.location.origin + selectLastView(store.getState()))
        );
      } else if (initialView == LibraryView.Songs) {
        dispatch(replace(window.location.origin + BASEPATH));
      } else {
        dispatch(replace(window.location.origin + BASEPATH + initialView));
      }
      const osType = await type();
      switch (osType) {
        case "Windows_NT":
          setPlatform(Platform.Windows);
          break;
        case "Darwin":
          setPlatform(Platform.Mac);
          break;
        case "Linux":
          setPlatform(Platform.Linux);
          break;
        default:
          break;
      }
      setFullscreen(await appWindow.isFullscreen());
      if (osType == "Windows_NT") {
        setDecorations(await appWindow.isDecorated());
      }
      setMinimiseToTray(
        await invoke("get_app_config", {
          configItem: "minimisetotray"
        })
      );
      setReady(true);
      invoke("ready");
    }

    initialise();
  }, [dispatch, platform]);

  useEffect(() => {
    if (ready && selectInitialView(store.getState()) == "continue") {
      dispatch(setLastView(location.pathname));
    }
  }, [dispatch, location.pathname, ready]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri()) {
        unlisten = await appWindow.onResized(() => {
          appWindow.isFullscreen().then((isFullscreen: boolean) => {
            setFullscreen(isFullscreen);
          });
        });
      }
    }
    init();
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [platform]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri() && !listeningToTauri.current) {
        listeningToTauri.current = true;
        unlisten = await appWindow.onMenuClicked(
          ({ payload: menuId }: { payload: string }) => {
            invokeMenuAction(menuId);
          }
        );
      }
    }
    init();
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [invokeMenuAction]);

  useEffect(() => {
    if (isTauri()) {
      invoke("update_menu_state", { menuState });
    }
  }, [menuState]);

  useEffect(() => {
    if (isTauri()) {
      const language = i18n.language;
      invoke("set_initial_language", { language });
    }
  }, []);

  const setDecorationsConfig = async (decorations: boolean) => {
    await appWindow.setDecorations(decorations);
    setDecorations(decorations);
  };

  const setMinimiseToTrayConfig = async (minimiseToTray: boolean) => {
    invoke("update_app_config", {
      configItem: "minimisetotray",
      newValue: minimiseToTray
    });
    setMinimiseToTray(minimiseToTray);
  };

  return (
    <PlatformContext.Provider
      value={{
        platform,
        fullscreen,
        decorations,
        minimiseToTray,
        setDecorations: setDecorationsConfig,
        setMinimiseToTray: setMinimiseToTrayConfig
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}
