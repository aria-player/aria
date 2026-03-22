import { i18n } from "i18next";
import { SourceCallbacks } from "../../../../types/plugins";
import { WebPlayerData } from "./createWebPlayer";
import { useTranslation } from "react-i18next";
import ClearIcon from "../../assets/xmark-solid.svg?react";
import styles from "./LibraryConfig.module.css";

export function LibraryConfig(props: {
  data: object;
  host: SourceCallbacks;
  loaded: boolean;
  pickDirectory: () => void;
  i18n: i18n;
}) {
  const webPlayerData = props.data as WebPlayerData;
  const { t } = useTranslation("web-player", { i18n: props.i18n });

  function removeFolder() {
    props.host.updateData({
      folder: "",
    } as WebPlayerData);
    props.host.removeLibraryTracks();
  }

  return (
    <>
      <h4 className="settings-heading">{t("config.folder")}</h4>
      <div className={styles.folderSettings}>
        <button
          className="settings-button"
          onClick={() => props.pickDirectory()}
        >
          {t("config.chooseFolder")}
        </button>
        {webPlayerData?.folder && (
          <span className={styles.folderLabel}>
            {t("config.currentFolder", { folder: webPlayerData.folder })}
          </span>
        )}
        {webPlayerData?.folder && (
          <button
            className={styles.removeButton}
            title={t("config.remove")}
            onClick={removeFolder}
          >
            <ClearIcon />
          </button>
        )}
      </div>
      {!props.loaded && webPlayerData?.folder && (
        <p>
          {t("config.folderNotLoaded", {
            folder: webPlayerData.folder,
          })}
        </p>
      )}
      <div className="settings-checkbox-container">
        <input
          type="checkbox"
          checked={webPlayerData.showAttribution ?? false}
          onChange={(e) =>
            props.host.updateData({ showAttribution: e.target.checked })
          }
        />{" "}
        {t("config.showAttribution")}
      </div>
    </>
  );
}
