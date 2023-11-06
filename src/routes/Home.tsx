import styles from "./Home.module.css";
import { useTranslation } from "react-i18next";
import { isTauri } from "../app/utils";

export function Home() {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h1>{isTauri() ? t("home.welcome") : t("home.welcomeWeb")}</h1>
    </div>
  );
}
