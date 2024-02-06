import { TrackUri } from "../../features/tracks/tracksTypes";
import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { WebPlayerData } from "./createWebPlayer";

export function Config(props: {
  data: object;
  host: SourceCallbacks;
  pickDirectory: () => void;
  fileHandles: Record<TrackUri, File>;
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

  const unloaded =
    webPlayerData.folder &&
    webPlayerData.total > 0 &&
    Object.keys(props.fileHandles).length == 0;

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
      {webPlayerData?.scanned < webPlayerData?.total && (
        <p>
          Scanned {webPlayerData.scanned}/{webPlayerData.total} tracks
        </p>
      )}
      {unloaded && (
        <p>
          Folder not current loaded. Please locate the &apos;
          {webPlayerData?.folder}&apos; folder.
        </p>
      )}
    </div>
  );
}
