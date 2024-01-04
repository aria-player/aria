import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { WebPlayerData } from "./createWebPlayer";

export function Config(props: {
  data: object;
  host: SourceCallbacks;
  pickDirectory: () => void;
}) {
  const webPlayerData = props.data as WebPlayerData;

  function removeFolder() {
    props.host.updateData({
      folder: "",
      scanned: 0,
      total: 0
    } as WebPlayerData);
    props.host.removeTracks();
  }

  return (
    <div>
      <button onClick={() => props.pickDirectory()}>Set folder</button>
      <p>
        Folder:
        {webPlayerData?.folder ? webPlayerData.folder : "None set"}
      </p>
      {webPlayerData?.folder && (
        <button onClick={removeFolder}>Remove folder</button>
      )}
      {webPlayerData?.scanned < webPlayerData?.total && (
        <p>
          Scanned {webPlayerData.scanned}/{webPlayerData.total} tracks
        </p>
      )}
    </div>
  );
}
