import { i18n } from "i18next";
import { SourceCallbacks } from "../../../../types/plugins";
import { WebPlayerData } from "./createWebPlayer";
import { useTranslation } from "react-i18next";

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
      folder: ""
    } as WebPlayerData);
    props.host.removeLibraryTracks();
  }

  return (
    <>
      <h4 className="settings-heading">{t("config.folder")}</h4>
      <button className="settings-button" onClick={() => props.pickDirectory()}>
        {t("config.chooseFolder")}
      </button>
      <p>
        {t("config.currentFolder", {
          folder: webPlayerData.folder || t("config.noFolder")
        })}
        {webPlayerData?.folder && (
          <button
            className="settings-button"
            style={{ margin: "0 1rem" }}
            onClick={removeFolder}
          >
            {t("config.remove")}
          </button>
        )}
      </p>
      {!props.loaded && webPlayerData?.folder && (
        <p>
          {t("config.folderNotLoaded", {
            folder: webPlayerData.folder
          })}
        </p>
      )}
    </>
  );
}
