import { SourceCallbacks } from "../../features/plugins/pluginsTypes";
import { WebPlayerConfig } from "./createWebPlayer";

export function Config(props: {
  config: object;
  host: SourceCallbacks;
  pickDirectory: () => void;
}) {
  const webPlayerConfig = props.config as WebPlayerConfig;

  function removeFolder() {
    props.host.updateConfig({
      folder: "",
      scanned: 0,
      total: 0
    } as WebPlayerConfig);
    props.host.removeTracks();
  }

  return (
    <div>
      <button onClick={() => props.pickDirectory()}>Set folder</button>
      <p>
        Folder:
        {webPlayerConfig?.folder ? webPlayerConfig.folder : "None set"}
      </p>
      {webPlayerConfig?.folder && (
        <button onClick={removeFolder}>Remove folder</button>
      )}
      {webPlayerConfig?.scanned < webPlayerConfig?.total && (
        <p>
          Scanned {webPlayerConfig.scanned}/{webPlayerConfig.total} tracks
        </p>
      )}
    </div>
  );
}
