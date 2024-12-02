import { i18n } from "i18next";
import styles from "./spotify.module.css";
import { useTranslation } from "react-i18next";

export default function ErrorDialog(props: {
  onClose: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });

  return (
    <div className={styles.dialogOuter}>
      <div className={styles.dialogInner} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>
          {t("errorDialog.premiumRequiredHeading")}
        </h3>
        <p>{t("errorDialog.premiumRequiredMessage")}</p>
        <button className="settings-button" onClick={props.onClose}>
          {t("errorDialog.logOut")}
        </button>
      </div>
    </div>
  );
}
