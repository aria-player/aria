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
import { useAppSelector } from "./app/hooks";
import { useContext, useEffect } from "react";
import {
  selectTheme,
  selectWindowDecorations,
  selectWindowFullscreen
} from "./features/config/configSlice";
import SettingsPage from "./routes/Settings";
import { Themes } from "./app/themes";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { AppearancePage } from "./routes/settings/AppearancePage";
import { AboutPage } from "./routes/settings/AboutPage";
import { MacTitleBar } from "./components/mac/MacTitleBar";
import { Platform, PlatformContext } from "./PlatformContext";

function App() {
  const theme = useAppSelector(selectTheme);
  const windowDecorations = useAppSelector(selectWindowDecorations);
  const windowFullscreen = useAppSelector(selectWindowFullscreen);
  const { platform } = useContext(PlatformContext);
  useKeyboardShortcuts();

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
      {platform == Platform.Mac && !windowFullscreen && <MacTitleBar />}
      {platform == Platform.Windows && !windowDecorations && <WindowsMenuBar />}
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
