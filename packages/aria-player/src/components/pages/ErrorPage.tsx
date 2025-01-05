import { useTranslation } from "react-i18next";
import styles from "./ErrorPage.module.css";

export default function ErrorPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.error}>
      <h2>{t("error.title")}</h2>
      <p>{t("error.notFound")}</p>
    </div>
  );
}
