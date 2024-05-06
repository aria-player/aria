import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { WebPlayerData } from "./createWebPlayer";

export function Config(props: {
  data: object;
  host: SourceCallbacks;
  loaded: boolean;
  pickDirectory: () => void;
}) {
  const webPlayerData = props.data as WebPlayerData;

  function removeFolder() {
    props.host.updateData({
      folder: ""
    } as WebPlayerData);
    props.host.removeTracks();
  }

  return (
    <div>
      <button onClick={() => props.pickDirectory()}>Choose folder</button>
      <p>
        Folder:
        {webPlayerData?.folder ? ` ${webPlayerData.folder} ` : " None set "}
        {webPlayerData?.folder && (
          <button onClick={removeFolder}>Remove</button>
        )}
      </p>
      {!props.loaded && webPlayerData?.folder && (
        <p>
          Folder not current loaded. Please locate the &apos;
          {webPlayerData.folder}&apos; folder.
        </p>
      )}
    </div>
  );
}
