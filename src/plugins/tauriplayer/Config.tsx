import styles from "./Config.module.css";
import RemoveIcon from "../../assets/trash-can-solid.svg?react";
import { i18n } from "i18next";
import { useTranslation } from "react-i18next";

export function Config(props: {
  folders: Record<string, string[]>;
  addFolder: () => void;
  removeFolder: (folder: string) => void;
  i18n: i18n;
}) {
  const { t } = useTranslation("tauriplayer", { i18n: props.i18n });

  return (
    <>
      <h4>{t("config.folders")}</h4>
      <table className={styles.folders}>
        <thead>
          <tr>
            <th className={styles.pathColumn}>{t("config.path")}</th>
            <th className={styles.separatedColumn}>{t("config.tracks")}</th>
            <th className={styles.separatedColumn}>{t("config.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {Object.keys(props.folders).map((folder) => (
            <tr key={folder}>
              <td className={styles.pathColumn}>{folder}</td>
              <td>{props.folders[folder]?.length}</td>
              <td>
                <button
                  onClick={() => {
                    props.removeFolder(folder);
                  }}
                  title={t("config.removeFolder")}
                  // TODO: This is a workaround since CSS modules do not seem to take precedence over 'settings.module.css'
                  style={{
                    padding: 0,
                    border: "none"
                  }}
                  className={styles.removeButton}
                >
                  <RemoveIcon />
                </button>
              </td>
            </tr>
          ))}
          {Object.keys(props.folders).length === 0 ? (
            <td colSpan={3}>
              <div className={styles.noFolders}>
                <i>{t("config.noFolders")}</i>
              </div>
            </td>
          ) : null}
        </tbody>
      </table>
      <button onClick={props.addFolder}>{t("config.addFolder")}</button>
    </>
  );
}
