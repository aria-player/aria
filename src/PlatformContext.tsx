import { invoke } from "@tauri-apps/api";
import { type } from "@tauri-apps/api/os";
import { appWindow } from "@tauri-apps/api/window";
import { ReactNode, createContext, useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { selectMenuState, handleMenuAction } from "./app/menu";
import { isTauri } from "./app/utils";

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

  const listeningToTauri = useRef(false);
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
      if (osType === "Darwin") {
        setFullscreen(await appWindow.isFullscreen());
      }
      if (osType == "Windows_NT") {
        setDecorations(await appWindow.isDecorated());
      }
      setMinimiseToTray(
        (await invoke("get_app_config", {
          configItem: "minimisetotray"
        })) as boolean
      );
    }

    initialise();
  }, [dispatch, platform]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri() && platform == Platform.Mac) {
        unlisten = await appWindow.onResized(() => {
          appWindow.isFullscreen().then((isFullscreen) => {
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
  }, [dispatch, platform]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri() && !listeningToTauri.current) {
        listeningToTauri.current = true;
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
