import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { WebPlayerData } from "./createWebPlayer";
import { useTranslation } from "react-i18next";

export function Config(props: {
  data: object;
  host: SourceCallbacks;
  loaded: boolean;
  pickDirectory: () => void;
}) {
  const webPlayerData = props.data as WebPlayerData;
  const { t } = useTranslation();

  function removeFolder() {
    props.host.updateData({
      folder: ""
    } as WebPlayerData);
    props.host.removeTracks();
  }

  return (
    <div>
      <button onClick={() => props.pickDirectory()}>
        {t("webplayer:config.chooseFolder")}
      </button>
      <p>
        {t("webplayer:config.currentFolder", {
          folder: webPlayerData.folder || t("webplayer:config.noFolder")
        })}
        {webPlayerData?.folder && (
          <button onClick={removeFolder}>{t("webplayer:config.remove")}</button>
        )}
      </p>
      {!props.loaded && webPlayerData?.folder && (
        <p>
          {t("webplayer:config.folderNotLoaded", {
            folder: webPlayerData.folder
          })}
        </p>
      )}
    </div>
  );
}
