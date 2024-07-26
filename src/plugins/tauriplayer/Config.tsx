import { useTranslation } from "react-i18next";
import styles from "./Config.module.css";
import RemoveIcon from "./assets/trash-can-solid.svg?react";

export function Config(props: {
  folders: Record<string, string[]>;
  addFolder: () => void;
  removeFolder: (folder: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <h4>{t("tauriplayer:config.folders")}</h4>
      <table className={styles.folders}>
        <thead>
          <tr>
            <th className={styles.pathColumn}>
              {t("tauriplayer:config.path")}
            </th>
            <th className={styles.separatedColumn}>
              {t("tauriplayer:config.tracks")}
            </th>
            <th className={styles.separatedColumn}>
              {t("tauriplayer:config.actions")}
            </th>
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
                  title={t("tauriplayer:config.removeFolder")}
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
                <i>{t("tauriplayer:config.noFolders")}</i>
              </div>
            </td>
          ) : null}
        </tbody>
      </table>
      <button onClick={props.addFolder}>
        {t("tauriplayer:config.addFolder")}
      </button>
    </>
  );
}
