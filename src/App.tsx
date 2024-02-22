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
import { PluginsPage } from "./components/views/settings/PluginsPage";
import { LibraryPage } from "./components/views/settings/LibraryPage";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  selectSidebarCollapsed,
  selectSidebarWidth,
  setSidebarConfig
} from "./features/config/configSlice";
import { ContextMenuContainer } from "./components/contextmenu/ContextMenuContainer";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist
} from "./features/sharedSelectors";
import { DisplayMode } from "./app/view";
import DebugView from "./components/views/DebugView";

function App() {
  const { platform, fullscreen } = useContext(PlatformContext);
  useKeyboardShortcuts();
  useTheme();

  const dispatch = useAppDispatch();
  const sidebarWidth = useAppSelector(selectSidebarWidth);
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
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
              <Route path="/queue" Component={() => <></>} />
              <Route path="/albums" Component={() => <>albums</>} />
              <Route path="/artists" Component={() => <>artists</>} />
              <Route path="/genres" Component={() => <>genres</>} />
              <Route path="/composers" Component={() => <>composers</>} />
              <Route path="/years" Component={() => <>years</>} />
              <Route path="settings" Component={SettingsPage}>
                <Route index Component={GeneralPage} />
                <Route path="library" Component={LibraryPage} />
                <Route path="appearance" Component={AppearancePage} />
                <Route path="plugins" Component={PluginsPage} />
                <Route path="about" Component={AboutPage} />
              </Route>
              <Route
                path="playlist/:id"
                Component={() => (visiblePlaylist?.id ? <></> : <ErrorPage />)}
              />
              <Route path="*" Component={ErrorPage} />
            </Routes>
            <div
              style={{
                height: "100%",
                width: "100%",
                display:
                  visibleDisplayMode == DisplayMode.TrackList ? "block" : "none"
              }}
            >
              <TrackList />
            </div>
            {visibleDisplayMode == DisplayMode.DebugView && <DebugView />}
          </div>
        </Allotment.Pane>
      </Allotment>
      <Footer />
    </div>
  );
}

export default App;
