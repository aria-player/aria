import { useState, ChangeEvent } from "react";
import styles from "./spotify.module.css";
import { Trans, useTranslation } from "react-i18next";
import { i18n } from "i18next";
import { isTauri } from "../../app/utils";
import { open } from "@tauri-apps/plugin-shell";
import CopyIcon from "../../assets/copy-regular.svg?react";

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
  const [copied, setCopied] = useState(false);
  const bold = { b: <strong /> };

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
            <Trans
              i18nKey="setup.step1"
              i18n={props.i18n}
              ns="spotify-player"
              components={{
                ...bold,
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
            <Trans
              i18nKey="setup.step2"
              i18n={props.i18n}
              ns="spotify-player"
              components={bold}
            />
          </li>
          <li>
            <Trans
              i18nKey="setup.step3"
              i18n={props.i18n}
              ns="spotify-player"
              components={bold}
            />
          </li>
          <li>
            <Trans
              i18nKey="setup.step4"
              i18n={props.i18n}
              ns="spotify-player"
              components={bold}
            />
          </li>
          <li>
            <Trans
              i18nKey="setup.step5"
              i18n={props.i18n}
              ns="spotify-player"
              components={bold}
            />
            <br />
            <span className={styles.uriBlockWrapper}>
              <input
                type="text"
                className={styles.uriBlock}
                readOnly
                value={props.redirectUri}
                size={props.redirectUri.length || 1}
              />
              <button
                className={styles.uriCopyButton}
                onClick={() => {
                  navigator.clipboard.writeText(props.redirectUri);
                  setCopied(true);
                }}
                title={t("setup.copyUri")}
              >
                <CopyIcon />
              </button>
            </span>
            {copied && (
              <span className={styles.copiedLabel}>{t("setup.copied")}</span>
            )}
          </li>
          <li>
            <Trans
              i18nKey="setup.step6"
              i18n={props.i18n}
              ns="spotify-player"
              components={bold}
            />
          </li>
        </ol>
        <label className={styles.clientIdLabel}>
          <Trans
            i18nKey="setup.clientIdLabel"
            i18n={props.i18n}
            ns="spotify-player"
            components={bold}
          />
        </label>
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
