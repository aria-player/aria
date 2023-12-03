import { PluginCallbacks } from "../../features/plugins/pluginsTypes";
import { WebPlayerConfig } from "./createWebPlayer";

export function Config(props: { config: unknown; host: PluginCallbacks }) {
  const webPlayerConfig = props.config as WebPlayerConfig;

  async function pickDirectory() {
    const directoryHandle = await window.showDirectoryPicker({
      id: "libraryDirectory",
      startIn: "music"
    });
    if (directoryHandle != undefined) {
      props.host.updateConfig({ folder: directoryHandle.name });
    }
  }

  function removeFolder() {
    props.host.updateConfig({ folder: "" });
  }

  return (
    <div>
      <button onClick={() => pickDirectory()}>Set folder</button>
      <p>
        Folder:
        {webPlayerConfig?.folder ? webPlayerConfig.folder : "None set"}
      </p>
      {webPlayerConfig?.folder && (
        <button onClick={removeFolder}>Remove folder</button>
      )}
    </div>
  );
}
