import { i18n } from "i18next";
import styles from "./applemusic.module.css";
import { useTranslation } from "react-i18next";

export default function QuickStart(props: {
  authenticate: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("apple-music-player", { i18n: props.i18n });

  return (
    <button className={styles.loginButton} onClick={props.authenticate}>
      {t("settings.logInWithAppleMusic")}
    </button>
  );
}
