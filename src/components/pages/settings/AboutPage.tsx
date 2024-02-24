import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
      <h4 className={styles.header}>{t("settings.about.version")}</h4>
      1.0
    </>
  );
}
