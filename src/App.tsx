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
import { useEffect } from "react";
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

function App() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector(selectTheme);
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const menuState = useAppSelector(selectMenuState);
  useKeyboardShortcuts();

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

  useEffect(() => {
    async function updateLocalDecorated() {
      const decorated = await appWindow.isDecorated();
      if (!decorated && windowDecorations) {
        // They're out of sync, so reset
        dispatch(setWindowDecorations(false));
      }
    }
    if (isTauri()) updateLocalDecorated();
  }, [dispatch, windowDecorations]);

  return (
    <div className={styles.window}>
      {isTauri() && !windowDecorations && <WindowsMenuBar />}
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
              <Route path="settings" Component={SettingsPage} />
              <Route path="*" Component={ErrorPage} />
            </Routes>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default App;
