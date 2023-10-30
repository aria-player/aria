import { WindowsMenuBar } from "./components/windows/WindowsMenuBar";
import styles from "./App.module.css";
import { isTauri } from "./app/utils";
import { NavLink, Route, Routes } from "react-router-dom";
import ErrorPage from "./routes/Error";
import { Home } from "./routes/Home";
import { MenuButton } from "./components/MenuButton";
// Allotment types coming soon
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import { useEffect, useState } from "react";
import {
  selectTheme,
  selectWindowDecorations,
  setWindowDecorations
} from "./features/config/configSlice";
import SettingsPage from "./routes/Settings";
import { listen } from "@tauri-apps/api/event";
import { Themes } from "./app/themes";
import { handleMenuAction, selectMenuState } from "./app/menu";
import { invoke } from "@tauri-apps/api";
import { appWindow } from "@tauri-apps/api/window";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { AppearancePage } from "./routes/settings/AppearancePage";
import { AboutPage } from "./routes/settings/AboutPage";
import { MacTitleBar } from "./components/mac/MacTitleBar";
import { type } from "@tauri-apps/api/os";

function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const menuState = useAppSelector(selectMenuState);
  const [isMac, setIsMac] = useState<boolean | null>(null);
  const [fullscreen, setFullscreen] = useState<boolean | null>(null);
  useKeyboardShortcuts();

  useEffect(() => {
    async function initialise() {
      if (fullscreen === null) {
        const isFullscreen = await appWindow.isFullscreen();
        setFullscreen(isFullscreen);
      }
      if (isMac === null) {
        const osType = await type();
        setIsMac(osType == "Darwin");
      }
      if (isMac) return;
      const decorated = appWindow.isDecorated();
      if (!decorated && windowDecorations) {
        // They're out of sync, so reset
        dispatch(setWindowDecorations(false));
      }
    }
    if (isTauri()) initialise();
  }, [dispatch, windowDecorations, isMac, fullscreen]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function init() {
      if (isTauri()) {
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

  useEffect(() => {
    if (theme === Themes.System.id) {
      const darkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
    } else {
      document.body.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== Themes.System.id) return;
    const handleChange = (e: MediaQueryListEvent) => {
      document.body.setAttribute("data-theme", e.matches ? "dark" : "light");
    };

    const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
    prefersDarkScheme.addEventListener("change", handleChange);
    return () => {
      prefersDarkScheme.removeEventListener("change", handleChange);
    };
  }, [theme]);

  return (
    <div className={styles.window}>
      {isTauri() && isMac && !fullscreen && <MacTitleBar />}
      {isTauri() && isMac === false && !windowDecorations && <WindowsMenuBar />}
      <Allotment snap proportionalLayout={false}>
        <Allotment.Pane preferredSize={200}>
          <div className={styles.sideBar}>
            {!isTauri() && (
              <div>
                <MenuButton />
              </div>
            )}
            <NavLink
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.selected : ""}`
              }
              to="/"
            >
              Home
            </NavLink>
            <NavLink
              to="/404"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.selected : ""}`
              }
            >
              Error Example
            </NavLink>
          </div>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className={styles.outlet}>
            <Routes>
              <Route path="/" Component={Home} />
              <Route path="settings" Component={SettingsPage}>
                <Route index Component={AppearancePage} />
                <Route path="about" Component={AboutPage} />
              </Route>
              <Route path="*" Component={ErrorPage} />
            </Routes>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default App;
