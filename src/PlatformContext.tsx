import { invoke } from "@tauri-apps/api";
import { type } from "@tauri-apps/api/os";
import { appWindow } from "@tauri-apps/api/window";
import { ReactNode, createContext, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { selectMenuState, handleMenuAction } from "./app/menu";
import { isTauri } from "./app/utils";
import {
  selectWindowDecorations,
  selectWindowFullscreen,
  setWindowDecorations,
  setWindowFullscreen
} from "./features/config/configSlice";

export enum Platform {
  Unknown = "Unknown",
  Web = "Web",
  Windows = "Windows",
  Mac = "Mac",
  Linux = "Linux"
}

export const PlatformContext = createContext<{ platform: Platform }>({
  platform: Platform.Unknown
});

export function PlatformProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const windowFullscreen = useAppSelector(selectWindowFullscreen);
  const menuState = useAppSelector(selectMenuState);
  const [platform, setPlatform] = useState<Platform>(Platform.Unknown);

  useEffect(() => {
    async function initialise() {
      if (platform !== Platform.Unknown) return;
      if (!isTauri()) {
        setPlatform(Platform.Web);
        return;
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
      // Reset out of sync settings
      if (osType == "Darwin") {
        const fullscreen = await appWindow.isDecorated();
        if (!fullscreen && windowFullscreen) {
          dispatch(setWindowFullscreen(false));
        }
      } else {
        const decorated = await appWindow.isDecorated();
        if (!decorated && windowDecorations) {
          dispatch(setWindowDecorations(false));
        }
      }
    }

    initialise();
  }, [dispatch, platform, windowFullscreen, windowDecorations]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri()) {
        unlisten = await appWindow.onResized(() => {
          appWindow.isFullscreen().then((isFullscreen) => {
            dispatch(setWindowFullscreen(isFullscreen));
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
  }, [dispatch]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri()) {
        unlisten = await appWindow.onMenuClicked(({ payload: menuId }) => {
          handleMenuAction(dispatch, menuId);
        });
      }
    }
    init();
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (isTauri()) {
      invoke("update_menu_state", { menuState });
    }
  }, [menuState]);

  return (
    <PlatformContext.Provider value={{ platform }}>
      {children}
    </PlatformContext.Provider>
  );
}
