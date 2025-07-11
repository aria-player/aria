import { WindowsMenuBar } from "./components/platforms/windows/WindowsMenuBar";
import styles from "./App.module.css";
import { Route, Routes } from "react-router-dom";
import { Allotment } from "allotment";
import { useContext } from "react";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { MacTitleBar } from "./components/platforms/mac/MacTitleBar";
import { Platform, PlatformContext } from "./contexts/PlatformContext";
import { useTheme } from "./hooks/useTheme";
import { Footer } from "./components/footer/Footer";
import { Sidebar } from "./components/sidebar/Sidebar";
import { useAppDispatch, useAppSelector } from "./app/hooks";
import {
  selectSidebarCollapsed,
  selectSidebarWidth,
  setSidebarConfig
} from "./features/config/configSlice";
import { ContextMenuContainer } from "./components/contextmenu/ContextMenuContainer";
import ErrorPage from "./components/pages/ErrorPage";
import SettingsPage from "./components/pages/SettingsPage";
import { AboutPage } from "./components/pages/settings/AboutPage";
import { AppearancePage } from "./components/pages/settings/AppearancePage";
import { GeneralPage } from "./components/pages/settings/GeneralPage";
import { LibraryPage } from "./components/pages/settings/LibraryPage";
import { PluginsPage } from "./components/pages/settings/PluginsPage";
import ViewContainer from "./components/views/ViewContainer";
import { selectVisiblePlaylist } from "./features/visibleSelectors";
import SearchPage from "./components/pages/SearchPage";
import { Toaster } from "sonner";

function App() {
  const { platform, fullscreen } = useContext(PlatformContext);
  useKeyboardShortcuts();
  useTheme();

  const dispatch = useAppDispatch();
  const sidebarWidth = useAppSelector(selectSidebarWidth);
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const handleDragEnd = (sizes: number[]) => {
    dispatch(setSidebarConfig({ width: sizes[0], collapsed: sizes[0] === 0 }));
  };

  if (platform === Platform.Unknown)
    return <div className={styles.loading}></div>;

  return (
    <div className={styles.window}>
      <ContextMenuContainer />
      <Toaster
        visibleToasts={1}
        position="bottom-center"
        offset={{ bottom: "5.5rem" }}
        style={{ zIndex: 99 }}
        swipeDirections={[]}
      />
      {platform == Platform.Mac && fullscreen === false && <MacTitleBar />}
      {platform == Platform.Windows && <WindowsMenuBar />}
      <Allotment
        proportionalLayout={false}
        onDragEnd={handleDragEnd}
        minSize={44}
      >
        <Allotment.Pane
          preferredSize={sidebarWidth}
          visible={!sidebarCollapsed}
        >
          <Sidebar />
        </Allotment.Pane>
        <Allotment.Pane>
          <div className={`main-view ${styles.outlet}`}>
            <ViewContainer />
            <Routes>
              <Route path="/" Component={() => <></>} />
              <Route path="/songs" Component={() => <></>} />
              <Route path="/queue" Component={() => <></>} />
              <Route path="/albums" Component={() => <></>} />
              <Route path="/artists" Component={() => <></>} />
              <Route path="/genres" Component={() => <></>} />
              <Route path="/composers" Component={() => <></>} />
              <Route path="/years" Component={() => <></>} />
              <Route path="/folders" Component={() => <></>} />
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
              <Route path="/search" Component={SearchPage} />
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
