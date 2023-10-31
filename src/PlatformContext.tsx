import { invoke } from "@tauri-apps/api";
import { listen } from "@tauri-apps/api/event";
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

export const PlatformContext = createContext<{
  isMac: boolean | null;
  isFullscreen: boolean | null;
}>({ isMac: null, isFullscreen: null });

export function PlatformProvider({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const menuState = useAppSelector(selectMenuState);
  const [isMac, setIsMac] = useState<boolean | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean | null>(null);

  useEffect(() => {
    async function initialise() {
      if (isFullscreen === null) {
        setIsFullscreen(await appWindow.isFullscreen());
      }
      if (isMac === null) {
        const osType = await type();
        setIsMac(osType == "Darwin");
      }
      if (isMac) return;
      const decorated = await appWindow.isDecorated();
      if (!decorated && windowDecorations) {
        // They're out of sync, so reset
        dispatch(setWindowDecorations(false));
      }
    }
    if (isTauri()) initialise();
  }, [dispatch, windowDecorations, isMac, isFullscreen]);

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
        unlisten = await listen<string>("menu_click", (event) => {
          handleMenuAction(dispatch, event.payload);
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
    <PlatformContext.Provider value={{ isMac, isFullscreen }}>
      {children}
    </PlatformContext.Provider>
  );
}
