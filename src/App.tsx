import { useState } from "react";
import reactLogo from "./assets/react.svg";
import reduxLogo from "./assets/redux.svg";
import tauriLogo from "./assets/tauri.svg";
import viteLogo from "./assets/vite.svg";
import { invoke } from "@tauri-apps/api/tauri";
import { WindowsMenuBar } from "./components/windows/WindowsMenuBar";
import { Counter } from "./features/counter/Counter";
import styles from "./App.module.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className={styles.app}>
      <WindowsMenuBar />
      <div className={styles.container}>
        <h1>Welcome to Tauri!</h1>

        <div className={styles.row}>
          <a href="https://vitejs.dev" target="_blank">
            <img
              src={viteLogo}
              className={`${styles.logo} ${styles.vite}`}
              alt="Vite logo"
            />
          </a>
          <a href="https://tauri.app" target="_blank">
            <img
              src={tauriLogo}
              className={`${styles.logo} ${styles.tauri}`}
              alt="Tauri logo"
            />
          </a>
          <a href="https://reactjs.org" target="_blank">
            <img
              src={reactLogo}
              className={`${styles.logo} ${styles.react}`}
              alt="React logo"
            />
          </a>
          <a href="https://redux.js.org/" target="_blank">
            <img
              src={reduxLogo}
              className={`${styles.logo} ${styles.redux}`}
              alt="Redux logo"
            />
          </a>
        </div>

        <p>Click on the Tauri, Vite, React, and Redux logos to learn more.</p>

        <form
          className={styles.row}
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Enter a name..."
          />
          <button type="submit">Greet</button>
        </form>

        <p>{greetMsg}</p>
        <Counter />
      </div>
    </div>
  );
}

export default App;
