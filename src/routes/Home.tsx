import { useState } from "react";
import reactLogo from "../assets/react.svg";
import reduxLogo from "../assets/redux.svg";
import tauriLogo from "../assets/tauri.svg";
import viteLogo from "../assets/vite.svg";
import { invoke } from "@tauri-apps/api/tauri";
import styles from "./Home.module.css";
import { Counter } from "../features/counter/Counter";
import { useTranslation } from "react-i18next";
import { isTauri } from "../app/utils";

export function Home() {
  const { t } = useTranslation();

  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    <div className={styles.container}>
      <h1>{isTauri() ? t("home.welcome") : t("home.welcomeWeb")}</h1>

      <div className={styles.row}>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img
            src={viteLogo}
            className={`${styles.logo} ${styles.vite}`}
            alt={t("home.alt.vite")}
          />
        </a>
        <a href="https://tauri.app" target="_blank" rel="noreferrer">
          <img
            src={tauriLogo}
            className={`${styles.logo} ${styles.tauri}`}
            alt={t("home.alt.tauri")}
          />
        </a>
        <a href="https://reactjs.org" target="_blank" rel="noreferrer">
          <img
            src={reactLogo}
            className={`${styles.logo} ${styles.react}`}
            alt={t("home.alt.react")}
          />
        </a>
        <a href="https://redux.js.org/" target="_blank" rel="noreferrer">
          <img
            src={reduxLogo}
            className={`${styles.logo} ${styles.redux}`}
            alt={t("home.alt.redux")}
          />
        </a>
      </div>

      <p>{t("home.info")}</p>
      {isTauri() && (
        <form
          className={styles.row}
          onSubmit={(e) => {
            e.preventDefault();
            greet();
          }}
        >
          <input
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder={t("home.inputPlaceholder")}
          />
          <button type="submit">{t("home.greet")}</button>
        </form>
      )}
      <p>{greetMsg}</p>
      <Counter />
    </div>
  );
}
