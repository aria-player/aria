import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import localforage from "localforage";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
      <h3 className={styles.title}>{t("settings.sections.about")}</h3>
      <p>{t("settings.about.subtitle")}</p>
      <hr className={styles.divider} />
      <h4 className={styles.header}>{t("settings.about.version")}</h4>
      1.0
      <br />
      <button
        onClick={async () => {
          const confirmed = await confirm(t("settings.about.confirmReset"));
          if (confirmed) {
            await localforage.clear();
            window.location.reload();
          }
        }}
      >
        {t("settings.about.reset")}
      </button>
    </>
  );
}
