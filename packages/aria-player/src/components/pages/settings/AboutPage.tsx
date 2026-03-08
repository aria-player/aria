import { useTranslation } from "react-i18next";
import styles from "./settings.module.css";
import localforage from "localforage";
import { pluginFormatVersion } from "../../../plugins/plugins";
import { themeFormatVersion } from "../../../themes/themes";
import { isTauri } from "../../../app/utils";
import { checkForUpdates } from "../../../app/updater";

export function AboutPage() {
  const { t } = useTranslation();

  return (
    <div className={styles.page}>
      <h3 className={styles.title}>{t("settings.sections.about")}</h3>
      <p>{t("settings.about.subtitle")}</p>
      <hr className={styles.separator} />
      <section className="settings-section">
        <h4 className="settings-heading">{t("settings.about.version")}</h4>
        <div className={styles.versionCard}>
          <h4 className={styles.title}>
            {t("settings.about.appVersion", {
              version: import.meta.env.PACKAGE_VERSION,
            })}
          </h4>
          <p className={styles.subtitle}>
            {t("settings.about.pluginFormatVersion", {
              version: pluginFormatVersion,
            })}
          </p>
          <p className={styles.subtitle}>
            {t("settings.about.themeFormatVersion", {
              version: themeFormatVersion,
            })}
          </p>
        </div>
        <div className={styles.updateButton}>
          {isTauri() && (
            <button
              className="settings-button"
              onClick={() => checkForUpdates()}
            >
              {t("settings.about.checkForUpdates")}
            </button>
          )}
        </div>
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
