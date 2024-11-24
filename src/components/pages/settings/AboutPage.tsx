import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import localforage from "localforage";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <h3 className={styles.title}>{t("settings.sections.about")}</h3>
      <p>{t("settings.about.subtitle")}</p>
      <hr className={styles.separator} />
      <section className="settings-section">
        <h4 className="settings-heading">{t("settings.about.version")}</h4>
        {import.meta.env.PACKAGE_VERSION}
      </section>
      <section className="settings-section">
        <h4 className="settings-heading">{t("settings.about.reset")}</h4>
        <button
          className="settings-button"
          onClick={async () => {
            const confirmed = await confirm(t("settings.about.confirmReset"));
            if (confirmed) {
              await localforage.clear();
              window.location.reload();
            }
          }}
        >
          {t("settings.about.resetApplication")}
        </button>
      </section>
    </div>
  );
}
