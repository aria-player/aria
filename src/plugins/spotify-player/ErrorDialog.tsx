import { i18n } from "i18next";
import styles from "./spotify.module.css";
import { Trans, useTranslation } from "react-i18next";
import { BASEPATH } from "../../app/constants";

export type ErrorDialogType = "premiumRequired" | "clientIdRequired";

export default function ErrorDialog(props: {
  errorDialogType: ErrorDialogType;
  onClose: () => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("spotify-player", { i18n: props.i18n });

  return (
    <div className={styles.dialogOuter}>
      <div className={styles.dialogInner} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.heading}>
          {t(
            props.errorDialogType == "premiumRequired"
              ? "errorDialog.premiumRequiredHeading"
              : "errorDialog.clientIdRequiredHeading"
          )}
        </h3>
        <p>
          {props.errorDialogType == "premiumRequired" ? (
            t("errorDialog.premiumRequiredMessage")
          ) : (
            <Trans
              i18nKey="spotify-player:errorDialog.clientIdRequiredMessage"
              components={{
                uri: (
                  <span className={styles.uri}>
                    {window.location.origin + BASEPATH}
                  </span>
                )
              }}
            />
          )}
        </p>
        <button className="settings-button" onClick={props.onClose}>
          {t(
            props.errorDialogType == "premiumRequired"
              ? "errorDialog.logOut"
              : "errorDialog.close"
          )}
        </button>
      </div>
    </div>
  );
}
