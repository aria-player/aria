import { invoke } from "@tauri-apps/api";
import { type } from "@tauri-apps/api/os";
import { appWindow } from "@tauri-apps/api/window";
import { ReactNode, createContext, useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { selectMenuState, handleMenuAction } from "./app/menu";
import { isTauri } from "./app/utils";
import {
  selectWindowDecorations,
  setWindowDecorations
} from "./features/config/configSlice";

export enum Platform {
  Unknown = "Unknown",
  Web = "Web",
  Windows = "Windows",
  Mac = "Mac",
  Linux = "Linux"
}

export const PlatformContext = createContext<{
  platform: Platform;
  isFullscreen: boolean | null;
}>({ platform: Platform.Unknown, isFullscreen: null });

export function PlatformProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const menuState = useAppSelector(selectMenuState);
  const [platform, setPlatform] = useState<Platform>(Platform.Unknown);
  const [isFullscreen, setIsFullscreen] = useState<boolean | null>(null);

  useEffect(() => {
    async function initialise() {
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
      if (isFullscreen === null) {
        setIsFullscreen(await appWindow.isFullscreen());
      }
      if (osType == "Darwin") return;
      const decorated = await appWindow.isDecorated();
      if (!decorated && windowDecorations) {
        // They're out of sync, so reset
        dispatch(setWindowDecorations(false));
      }
    }
    if (platform == Platform.Unknown) {
      initialise();
    }
  }, [dispatch, windowDecorations, platform, isFullscreen]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri()) {
        unlisten = await appWindow.onResized(() => {
          appWindow.isFullscreen().then((isFullscreen) => {
            setIsFullscreen(isFullscreen);
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
  }, []);

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
    <PlatformContext.Provider value={{ platform, isFullscreen }}>
      {children}
    </PlatformContext.Provider>
  );
}
