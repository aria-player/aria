import { i18n } from "i18next";
import styles from "./applemusic.module.css";
import { useTranslation } from "react-i18next";
import { useState } from "react";

export default function QuickStart(props: {
  authenticate: () => Promise<void>;
  i18n: i18n;
}) {
  const { t } = useTranslation("apple-music-player", { i18n: props.i18n });
  const [loginEnabled, setLoginEnabled] = useState(true);

  return (
    <button
      className={styles.loginButton}
      disabled={!loginEnabled}
      onClick={async () => {
        setLoginEnabled(false);
        try {
          await props.authenticate();
        } finally {
          setLoginEnabled(true);
        }
      }}
    >
      {t("settings.logInWithAppleMusic")}
    </button>
  );
}
