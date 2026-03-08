import { useState, ChangeEvent } from "react";
import styles from "./spotify.module.css";
import { Trans, useTranslation } from "react-i18next";
import { i18n } from "i18next";
import { isTauri } from "../../app/utils";
import { open } from "@tauri-apps/plugin-shell";

const DEVELOPER_URL = "https://developer.spotify.com";

export default function SpotifySetupDialog(props: {
  redirectUri: string;
  initialClientId: string;
  onSubmit: (clientId: string) => void;
  onClose: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });
  const [clientId, setClientId] = useState(props.initialClientId);

  function handleContinue() {
    const trimmed = clientId.trim();
    if (trimmed) props.onSubmit(trimmed);
  }

  return (
    <div className={styles.dialogOuter}>
      <div className={styles.setupDialog} onClick={(e) => e.stopPropagation()}>
        <div className={styles.setupHeader}>
          <h3 className={styles.setupHeading}>{t("setup.heading")}</h3>
        </div>
        <div className={styles.setupDescription}>{t("setup.description")}</div>
        <ol className={styles.setupSteps}>
          <li>
            <strong>{t("setup.stepLabel", { number: 1 })}</strong>{" "}
            <Trans
              i18nKey="setup.step1"
              i18n={props.i18n}
              ns="spotify-player"
              components={{
                a: (
                  <a
                    href={DEVELOPER_URL}
                    className={styles.setupLink}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isTauri()) {
                        open(DEVELOPER_URL);
                      } else {
                        window.open(DEVELOPER_URL, "_blank", "noreferrer");
                      }
                    }}
                  />
                ),
              }}
            />
          </li>
          <li>
            <strong>{t("setup.stepLabel", { number: 2 })}</strong>{" "}
            {t("setup.step2")}
          </li>
          <li>
            <strong>{t("setup.stepLabel", { number: 3 })}</strong>{" "}
            {t("setup.step3")}
          </li>
          <li>
            <strong>{t("setup.stepLabel", { number: 4 })}</strong>{" "}
            {t("setup.step4")}
            <br />
            <input
              type="text"
              className={styles.uriBlock}
              readOnly
              value={props.redirectUri}
              size={props.redirectUri.length || 1}
            />
          </li>
          <li>
            <strong>{t("setup.stepLabel", { number: 5 })}</strong>{" "}
            {t("setup.step5")}
          </li>
        </ol>
        <input
          type="text"
          className={styles.clientIdInput}
          value={clientId}
          placeholder={t("setup.clientIdPlaceholder")}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            setClientId(e.target.value)
          }
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === "Enter") handleContinue();
          }}
        />
        <div className={styles.setupNotice}>{t("setup.notice")}</div>
        <div className={styles.setupButtons}>
          <button className="settings-button" onClick={props.onClose}>
            {t("setup.cancel")}
          </button>
          <button
            className={`settings-button ${styles.setupContinueButton}`}
            onClick={handleContinue}
            disabled={!clientId.trim()}
          >
            {t("setup.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}
