import { WindowsMenuBar } from "./components/platforms/windows/WindowsMenuBar";
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
import { useContext } from "react";
import SettingsPage from "./routes/Settings";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { AppearancePage } from "./routes/settings/AppearancePage";
import { AboutPage } from "./routes/settings/AboutPage";
import { MacTitleBar } from "./components/platforms/mac/MacTitleBar";
import { Platform, PlatformContext } from "./contexts/PlatformContext";
import { GeneralPage } from "./routes/settings/GeneralPage";
import { useTheme } from "./hooks/useTheme";
import { useTranslation } from "react-i18next";
import { Footer } from "./components/footer/Footer";

function App() {
  const { t } = useTranslation();
  const { platform, fullscreen } = useContext(PlatformContext);
  useKeyboardShortcuts();
  useTheme();

  if (platform === Platform.Unknown)
    return <div className={styles.loading}></div>;

  return (
    <div className={styles.window}>
      {platform == Platform.Mac && fullscreen === false && <MacTitleBar />}
      {platform == Platform.Windows && <WindowsMenuBar />}
      <Allotment snap proportionalLayout={false}>
        <Allotment.Pane preferredSize={200}>
          <div className={styles.sideBar}>
            {!isTauri() && (
              <div className={styles.webMenu}>
                <MenuButton />
              </div>
            )}
            <input
              className={styles.search}
              type="text"
              placeholder={t("nav.search")}
            />
            <NavLink
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.selected : ""}`
              }
              to="/"
            >
              {t("nav.home")}
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `${styles.link} ${isActive ? styles.selected : ""}`
              }
            >
              {t("nav.settings")}
            </NavLink>
          </div>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className={styles.outlet}>
            <Routes>
              <Route path="/" Component={Home} />
              <Route path="settings" Component={SettingsPage}>
                <Route index Component={GeneralPage} />
                <Route path="appearance" Component={AppearancePage} />
                <Route path="about" Component={AboutPage} />
              </Route>
              <Route path="*" Component={ErrorPage} />
            </Routes>
          </div>
        </Allotment.Pane>
      </Allotment>
      <Footer />
    </div>
  );
}

export default App;
