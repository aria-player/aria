import { invoke } from "@tauri-apps/api/core";
import { type } from "@tauri-apps/plugin-os";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { ReactNode, createContext, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { MenuItem, selectMenuState } from "../app/menu";
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
import menus from "../../shared/menus.json";

const appWindow = getCurrentWebviewWindow();

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
  minimizeToTray: boolean | null;
  setDecorations: (decorations: boolean) => void;
  setMinimizeToTray: (minimizeToTray: boolean) => void;
}>({
  platform: Platform.Unknown,
  fullscreen: null,
  decorations: null,
  minimizeToTray: null,
  setDecorations: () => {},
  setMinimizeToTray: () => {}
});

export function PlatformProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const menuState = useAppSelector(selectMenuState);
  const { invokeMenuAction } = useMenuActions();
  const location = useLocation();

  const [ready, setReady] = useState(false);
  const [platform, setPlatform] = useState<Platform>(Platform.Unknown);
  const [fullscreen, setFullscreen] = useState<boolean | null>(null);
  const [decorations, setDecorations] = useState<boolean | null>(null);
  const [minimizeToTray, setMinimizeToTray] = useState<boolean | null>(null);

  useEffect(() => {
    async function initialize() {
      if (platform !== Platform.Unknown) return;
      const initialView = selectInitialView(store.getState());
      if (window.location.pathname == BASEPATH) {
        if (initialView == "continue") {
          dispatch(replace(BASEPATH + selectLastView(store.getState())));
        } else {
          dispatch(replace(BASEPATH + initialView));
        }
      }
      if (!isTauri()) {
        setPlatform(Platform.Web);
        setReady(true);
        return;
      }
      const osType = await type();
      switch (osType) {
        case "windows":
          setPlatform(Platform.Windows);
          break;
        case "macos":
          setPlatform(Platform.Mac);
          break;
        case "linux":
          setPlatform(Platform.Linux);
          break;
        default:
          break;
      }
      setFullscreen(await appWindow.isFullscreen());
      if (osType == "windows") {
        setDecorations(await appWindow.isDecorated());
      }
      setMinimizeToTray(
        await invoke("get_app_config", {
          configItem: "minimizetotray"
        })
      );
      setReady(true);
      invoke("ready");
    }

    initialize();
  }, [dispatch, platform, location]);

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
    const registerListeners = async (items: MenuItem[]) => {
      const unlistenFns: (() => void)[] = [];
      for (const item of items) {
        const unlisten = await getCurrentWebviewWindow().listen(
          item.id.replace(".", ":"),
          () => invokeMenuAction(item.id)
        );
        unlistenFns.push(unlisten);
        if (item.submenu) {
          unlistenFns.push(...(await registerListeners(item.submenu)));
        }
      }
      return unlistenFns;
    };

    const unlistenFunctions = registerListeners(menus);
    return () => {
      unlistenFunctions.then((unlistenFns) => {
        unlistenFns.forEach((unlisten) => unlisten());
      });
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

  const setMinimizeToTrayConfig = async (minimizeToTray: boolean) => {
    invoke("update_app_config", {
      configItem: "minimizetotray",
      newValue: minimizeToTray
    });
    setMinimizeToTray(minimizeToTray);
  };

  return (
    <PlatformContext.Provider
      value={{
        platform,
        fullscreen,
        decorations,
        minimizeToTray,
        setDecorations: setDecorationsConfig,
        setMinimizeToTray: setMinimizeToTrayConfig
      }}
    >
      {children}
    </PlatformContext.Provider>
  );
}
