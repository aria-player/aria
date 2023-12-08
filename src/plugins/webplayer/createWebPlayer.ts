import { TrackUri } from "../../features/library/libraryTypes";
import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import { Config } from "./Config";
import { getMetadata } from "./getMetadata";

export type WebPlayerConfig = {
  folder: string;
};

export function createWebPlayer(
  initialConfig: unknown,
  host: SourceCallbacks
): SourceHandle {
  console.log("Created webplayer with initial config: ", initialConfig);

  let folder = (initialConfig as WebPlayerConfig)?.folder;
  let fileHandles: { [key: TrackUri]: File } = {};
  let audio: HTMLAudioElement | null;

  async function pickDirectory() {
    const directoryHandle = await window.showDirectoryPicker({
      id: "libraryDirectory",
      startIn: "music"
    });
    if (directoryHandle != undefined) {
      if (directoryHandle.name != folder) {
        host.removeTracks();
      }
      folder = directoryHandle.name;
      host.updateConfig({ folder });
      fileHandles = await getAudioFileHandlesWeb(directoryHandle);
      const tracks = Object.keys(fileHandles).map((uri: TrackUri) => ({
        uri,
        title: fileHandles[uri].name,
        datemodified: fileHandles[uri].lastModified,
        filesize: fileHandles[uri].size,
        album: uri.split("/").slice(-2, -1)[0],
        metadataloaded: false
      }));
      host.addTracks(tracks);
      for (const track of tracks) {
        const metadata = await getMetadata(track, fileHandles[track.uri]);
        host.updateMetadata([metadata]);
      }
    }
  }

  async function getAudioFileHandlesWeb(
    directoryHandle: FileSystemDirectoryHandle,
    relativePath = ""
  ) {
    let localFileHandles: { [key: TrackUri]: File } = {};
    for await (const entry of directoryHandle.values()) {
      const entryRelativePath = relativePath
        ? `${relativePath}/${entry.name}`
        : `${directoryHandle.name}/${entry.name}`;
      if (entry.kind === "file") {
        const file = await entry.getFile();
        if (file.type.startsWith("audio/")) {
          localFileHandles[entryRelativePath] = file;
        }
      } else if (entry.kind === "directory") {
        localFileHandles = {
          ...localFileHandles,
          ...(await getAudioFileHandlesWeb(entry, entryRelativePath))
        };
      }
    }
    return localFileHandles;
  }

  return {
    Config: (props) => Config({ ...props, host, pickDirectory }),

    async loadAndPlayTrack(uri: TrackUri): Promise<void> {
      let file = fileHandles[uri];
      if (!file) {
        const confirmed = await confirm(
          "This file hasn't been loaded. Please re-select the '" +
            folder +
            "' folder."
        );
        if (!confirmed) return;
        await pickDirectory();
        file = fileHandles[uri];
        if (!file) throw new Error("File not found after re-selection");
      }

      if (audio) {
        audio.pause();
        audio.src = "";
      }
      audio = new Audio(await URL.createObjectURL(file));
      return new Promise<void>((resolve, reject) => {
        if (audio) {
          audio.oncanplay = () => {
            if (audio) {
              audio.play().then(resolve).catch(reject);
            }
          };
          audio.onerror = () => {
            reject(new Error("Error loading audio"));
          };
        }
      });
    },

    dispose() {
      console.log("Disposed webplayer");
    }
  };
}
