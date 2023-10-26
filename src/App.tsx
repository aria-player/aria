import { WindowsMenuBar } from "./components/windows/WindowsMenuBar";
import styles from "./App.module.css";
import { isTauri } from "./app/utils";
import { Link, Route, Routes } from "react-router-dom";
import ErrorPage from "./routes/Error";
import { Home } from "./routes/Home";
import { MenuButton } from "./components/MenuButton";
// Allotment types coming soon
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { useAppSelector } from "./app/hooks";
import { useEffect } from "react";
import { Theme, selectTheme } from "./features/config/configSlice";

function App() {
  const theme = useAppSelector(selectTheme);

  useEffect(() => {
    if (theme === Theme.System) {
      const darkMode = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
    } else {
      document.body.setAttribute("data-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== Theme.System) return;
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
      {isTauri() && <WindowsMenuBar />}
      <Allotment snap proportionalLayout={false}>
        <Allotment.Pane preferredSize={200}>
          <div className={styles.sideBar}>
            {!isTauri() && (
              <div>
                <MenuButton />
              </div>
            )}
            <Link to="/" className={styles.link}>
              Home
            </Link>
            <Link to="/404" className={styles.link}>
              Error Example
            </Link>
          </div>
        </Allotment.Pane>
        <Allotment.Pane>
          <div className={styles.outlet}>
            <Routes>
              <Route path="/" Component={Home} />
              <Route path="*" Component={ErrorPage} />
            </Routes>
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}

export default App;
