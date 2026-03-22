import { WindowsMenuBar } from "./components/platforms/windows/WindowsMenuBar";
import styles from "./App.module.css";
import { Route, Routes } from "react-router-dom";
import { Allotment } from "allotment";
import { useContext, useState } from "react";
import { useIsMobileBrowser } from "./hooks/useIsMobileBrowser";
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
  setSidebarConfig,
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
import SearchPage from "./components/pages/SearchPage";
import { Toaster } from "sonner";
import Header from "./components/header/Header";
import PluginAlertDialog from "./components/views/subviews/PluginAlertDialog";
import { QueuePage } from "./components/pages/QueuePage";
import SearchResultsPage from "./components/pages/SearchResultsPage";
import AllResultsPage from "./components/pages/search/AllResultsPage";

function App() {
  const { platform, fullscreen } = useContext(PlatformContext);
  useKeyboardShortcuts();
  useTheme();

  const dispatch = useAppDispatch();
  const isMobileBrowser = useIsMobileBrowser();
  const sidebarWidth = useAppSelector(selectSidebarWidth);
  const sidebarCollapsed = useAppSelector(selectSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileSidebarClosing, setMobileSidebarClosing] = useState(false);
  const isMobileSidebarOpen = isMobileBrowser && mobileSidebarOpen;

  const closeMobileSidebar = () => {
    setMobileSidebarClosing(true);
    setTimeout(() => {
      setMobileSidebarOpen(false);
      setMobileSidebarClosing(false);
    }, 200);
  };

  const handleDragEnd = (sizes: number[]) => {
    dispatch(setSidebarConfig({ width: sizes[0], collapsed: sizes[0] === 0 }));
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!e.shiftKey && !(e.target as HTMLElement).closest("input, textarea")) {
      e.preventDefault();
    }
  };

  if (platform === Platform.Unknown)
    return <div className={styles.loading}></div>;

  const routes = (
    <Routes>
      <Route path="/" Component={() => <></>} />
      <Route path="/songs" Component={ViewContainer} />
      <Route path="/album/:albumId" Component={ViewContainer} />
      <Route path="/albums" Component={ViewContainer} />
      <Route path="/albums/:albumId" Component={ViewContainer} />
      <Route path="/artists" Component={ViewContainer} />
      <Route path="/artists/:artist" Component={ViewContainer} />
      <Route path="/genres" Component={ViewContainer} />
      <Route path="/genres/:genre" Component={ViewContainer} />
      <Route path="/composers" Component={ViewContainer} />
      <Route path="/composers/:composer" Component={ViewContainer} />
      <Route path="/years" Component={ViewContainer} />
      <Route path="/years/:year" Component={ViewContainer} />
      <Route path="/folders" Component={ViewContainer} />
      <Route path="/folders/:folder" Component={ViewContainer} />
      <Route path="/queue" Component={QueuePage} />
      <Route path="/artist/:id" Component={ViewContainer} />
      <Route path="/artist/:id/songs" Component={ViewContainer} />
      <Route path="/artist/:id/albums" Component={ViewContainer} />
      <Route path="settings" Component={SettingsPage}>
        <Route index Component={GeneralPage} />
        <Route path="library" Component={LibraryPage} />
        <Route path="appearance" Component={AppearancePage} />
        <Route path="plugins" Component={PluginsPage} />
        <Route path="about" Component={AboutPage} />
      </Route>
      <Route path="playlist/:id" Component={ViewContainer} />
      <Route path="playlist/:id/:group" Component={ViewContainer} />
      <Route path="/search" Component={SearchPage} />
      <Route path="/search/:query/:source" Component={SearchResultsPage}>
        <Route index Component={AllResultsPage} />
        <Route path="songs" Component={ViewContainer} />
        <Route path="artists" Component={ViewContainer} />
        <Route path="albums" Component={ViewContainer} />
      </Route>
      <Route path="*" Component={ErrorPage} />
    </Routes>
  );

  return (
    <div className={styles.window} onContextMenu={handleContextMenu}>
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
      {isMobileBrowser ? (
        <div className={styles.mobileContent}>
          {mobileSidebarOpen && (
            <>
              <div
                className={`${styles.mobileBackdrop}${mobileSidebarClosing ? ` ${styles.mobileBackdropClosing}` : ""}`}
                onClick={isMobileSidebarOpen ? closeMobileSidebar : undefined}
              />
              <div
                className={`${styles.mobileSidebar}${mobileSidebarClosing ? ` ${styles.mobileSidebarClosing}` : ""}`}
              >
                <Sidebar onNavigate={closeMobileSidebar} />
              </div>{" "}
            </>
          )}
          <div className={`main-view ${styles.outlet} ${styles.mobileOutlet}`}>
            <Header
              onMobileSidebarToggle={() =>
                mobileSidebarOpen
                  ? closeMobileSidebar()
                  : setMobileSidebarOpen(true)
              }
            />
            <PluginAlertDialog />
            {routes}
          </div>
        </div>
      ) : (
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
              <Header />
              <PluginAlertDialog />
              {routes}
            </div>
          </Allotment.Pane>
        </Allotment>
      )}
      <Footer />
    </div>
  );
}

export default App;
