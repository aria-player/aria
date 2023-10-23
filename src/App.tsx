import { WindowsMenuBar } from "./components/windows/WindowsMenuBar";
import styles from "./App.module.css";
import { isTauri } from "./app/utils";
import { Link, Route, Routes } from "react-router-dom";
import ErrorPage from "./routes/Error";
import { Home } from "./routes/Home";
// Allotment types coming soon
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { Allotment } from "allotment";
import "allotment/dist/style.css";

function App() {
  return (
    <div className={styles.window}>
      {isTauri() && <WindowsMenuBar />}
      <Allotment snap proportionalLayout={false}>
        <Allotment.Pane preferredSize={200}>
          <div className={styles.sideBar}>
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
