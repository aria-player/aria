import {
  Track,
  TrackMetadata,
  TrackUri
} from "../../features/library/libraryTypes";
import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import { Config } from "./Config";
import { getMetadata } from "./getMetadata";

export type WebPlayerData = {
  folder: string;
  scanned: number;
  total: number;
};

export function createWebPlayer(host: SourceCallbacks): SourceHandle {
  const initialConfig = host.getData() as WebPlayerData | null;
  console.log("Created webplayer with initial config: ", initialConfig);

  let folder = initialConfig?.folder;
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
      fileHandles = await getAudioFileHandlesWeb(directoryHandle);
      host.updateData({
        folder,
        scanned: host.getTracks().filter((track) => track.metadataloaded)
          .length,
        total: Object.keys(fileHandles).length
      });

      const tracks = Object.keys(fileHandles).map((uri: TrackUri) => ({
        uri,
        title: fileHandles[uri].name,
        datemodified: fileHandles[uri].lastModified,
        dateadded: Date.now(),
        filesize: fileHandles[uri].size,
        album: uri.split("/").slice(-2, -1)[0],
        metadataloaded: false
      }));
      host.addTracks(tracks);
      updateTracksMetadata(tracks);
    }
  }

  async function updateTracksMetadata(tracks: TrackMetadata[]) {
    for (const track of tracks) {
      if (host.getTrackByUri(track.uri)?.metadataloaded) continue;
      const metadata = await getMetadata(track, fileHandles[track.uri]);
      host.updateMetadata([metadata]);
      host.updateData({
        scanned: (host.getData() as WebPlayerData).scanned + 1
      });
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
    Config: (props) => Config({ ...props, host, pickDirectory, fileHandles }),

    async loadAndPlayTrack(track: Track): Promise<void> {
      let file = fileHandles[track.uri];
      if (!file) {
        const confirmed = await confirm(
          "This file hasn't been loaded. Please re-select the '" +
            folder +
            "' folder."
        );
        if (!confirmed) throw new Error("Re-selection cancelled");
        await pickDirectory();
        file = fileHandles[track.uri];
        if (!file) throw new Error("File not found after re-selection");
      }
      if (!track.metadataloaded) {
        const metadata = await getMetadata(track, fileHandles[track.uri]);
        host.updateMetadata([metadata]);
        host.updateData({
          scanned: (host.getData() as WebPlayerData).scanned + 1
        });
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

    pause() {
      audio?.pause();
    },

    resume() {
      audio?.play();
    },

    dispose() {
      console.log("Disposed webplayer");
    }
  };
}
