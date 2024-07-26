import { useTranslation } from "react-i18next";

export function Config(props: {
  folders: Record<string, string[]>;
  handleButtonClick: () => void;
  removeFolder: (folder: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <>
      <h4>{t("tauriplayer:config.folders")}</h4>
      <button onClick={props.handleButtonClick}>
        {t("tauriplayer:config.addFolder")}
      </button>
      <ul>
        {Object.keys(props.folders).map((folder) => (
          <li key={folder}>
            {folder}
            <button
              onClick={() => {
                props.removeFolder(folder);
              }}
            >
              {t("tauriplayer:config.remove")}
            </button>
            {props.folders[folder]?.length}
          </li>
        ))}
      </ul>
    </>
  );
}
