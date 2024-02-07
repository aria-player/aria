import { WindowsMenuBar } from "./components/platforms/windows/WindowsMenuBar";
import styles from "./App.module.css";
import { Route, Routes } from "react-router-dom";
import ErrorPage from "./components/views/Error";
import { Allotment } from "allotment";
import { useContext } from "react";
import SettingsPage from "./components/views/Settings";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { AppearancePage } from "./components/views/settings/AppearancePage";
import { AboutPage } from "./components/views/settings/AboutPage";
import { MacTitleBar } from "./components/platforms/mac/MacTitleBar";
import { Platform, PlatformContext } from "./contexts/PlatformContext";
import { GeneralPage } from "./components/views/settings/GeneralPage";
import { useTheme } from "./hooks/useTheme";
import { Footer } from "./components/footer/Footer";
import { Sidebar } from "./components/sidebar/Sidebar";
import { TrackList } from "./components/views/TrackList";
import { AlbumGrid } from "./components/views/AlbumGrid";
import { PluginsPage } from "./components/views/settings/PluginsPage";
import { LibraryPage } from "./components/views/settings/LibraryPage";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  selectSidebarCollapsed,
  selectSidebarWidth,
  setSidebarConfig
} from "./features/config/configSlice";
import { ContextMenuContainer } from "./components/contextmenu/ContextMenuContainer";
import { BASEPATH } from "./app/constants";

function App() {
  const { platform, fullscreen } = useContext(PlatformContext);
  useKeyboardShortcuts();
  useTheme();

  const dispatch = useAppDispatch();
  const sidebarWidth = useAppSelector(selectSidebarWidth);
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const location = useAppSelector((state) => state.router.location);
  const handleDragEnd = (sizes: number[]) => {
    dispatch(setSidebarConfig({ width: sizes[0], collapsed: sizes[0] === 0 }));
  };

  if (platform === Platform.Unknown)
    return <div className={styles.loading}></div>;

  return (
    <div className={styles.window}>
      <ContextMenuContainer />
      {platform == Platform.Mac && fullscreen === false && <MacTitleBar />}
      {platform == Platform.Windows && <WindowsMenuBar />}
      <Allotment snap proportionalLayout={false} onDragEnd={handleDragEnd}>
        <Allotment.Pane
          preferredSize={sidebarWidth}
          visible={!sidebarCollapsed}
        >
          <Sidebar />
        </Allotment.Pane>
        <Allotment.Pane>
          <div className={styles.outlet}>
            <Routes>
              <Route path="/" Component={() => <></>} />
              <Route path="/albums" Component={AlbumGrid} />
              <Route path="settings" Component={SettingsPage}>
                <Route index Component={GeneralPage} />
                <Route path="library" Component={LibraryPage} />
                <Route path="appearance" Component={AppearancePage} />
                <Route path="plugins" Component={PluginsPage} />
                <Route path="about" Component={AboutPage} />
              </Route>
              <Route path="playlist/:id" Component={() => <></>} />
              <Route path="*" Component={ErrorPage} />
            </Routes>
            <div
              style={{
                height: "100%",
                width: "100%",
                display:
                  location?.pathname == BASEPATH ||
                  location?.pathname.includes("playlist/")
                    ? "block"
                    : "none"
              }}
            >
              <TrackList />
            </div>
          </div>
        </Allotment.Pane>
      </Allotment>
      <Footer />
    </div>
  );
}

export default App;
