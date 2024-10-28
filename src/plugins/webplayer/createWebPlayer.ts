import {
  Track,
  TrackMetadata,
  TrackUri
} from "../../features/tracks/tracksTypes";
import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import { LibraryConfig } from "./LibraryConfig";
import { wrap } from "comlink";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import QuickStart from "./QuickStart";

export type WebPlayerData = {
  folder: string;
};

export default function createWebPlayer(
  host: SourceCallbacks,
  i18n: i18n
): SourceHandle | null {
  if (!("showDirectoryPicker" in window)) {
    return null;
  }
  i18n.addResourceBundle("en-US", "webplayer", en_us);
  const { t } = i18n;
  const initialConfig = host.getData() as WebPlayerData | null;

  const metadataWorker = new Worker(
    new URL("./metadataWorker.ts", import.meta.url),
    { type: "module" }
  );
  const { fetchCoverArt, parseMetadata } =
    wrap<typeof import("./metadataWorker")>(metadataWorker);

  let folder = initialConfig?.folder;
  let fileHandles: { [key: TrackUri]: File } = {};
  let audio: HTMLAudioElement | null;
  let loaded: boolean;

  async function pickDirectory() {
    const directoryHandle = await window.showDirectoryPicker({
      id: "libraryDirectory",
      startIn: "music"
    });
    if (directoryHandle != undefined) {
      loaded = true;
      if (directoryHandle.name != folder) {
        host.removeTracks();
      }
      folder = directoryHandle.name;
      fileHandles = await getAudioFileHandlesWeb(directoryHandle);
      host.updateData({
        folder,
        scanned: host.getTracks().filter((track) => track.metadataLoaded)
          .length,
        total: Object.keys(fileHandles).length
      });

      const dateAdded = Date.now();
      const tracks = Object.keys(fileHandles).map((uri: TrackUri) => ({
        uri,
        title: fileHandles[uri].name,
        dateModified: fileHandles[uri].lastModified,
        dateAdded,
        filePath: uri,
        fileFolder: uri.split("/").slice(-2, -1)[0],
        fileSize: fileHandles[uri].size,
        album: uri.split("/").slice(-2, -1)[0],
        metadataLoaded: false
      }));
      host.addTracks(tracks);
      updateTracksMetadata(tracks);
    }
  }

  async function updateTracksMetadata(tracks: TrackMetadata[]) {
    const batchSize = 10;
    for (let i = 0; i < tracks.length; i += batchSize) {
      const metadataPromises = tracks
        .slice(i, i + batchSize)
        .filter((track) => !host.getTrackByUri(track.uri)?.metadataLoaded)
        .map((track) => parseMetadata(track, fileHandles[track.uri]));
      const newMetadata = await Promise.all(metadataPromises);
      host.updateMetadata(newMetadata);
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
    displayName: t("webplayer:localFiles"),

    LibraryConfig: (props) =>
      LibraryConfig({ ...props, host, loaded, pickDirectory, i18n }),

    QuickStart: (props) => QuickStart({ ...props, pickDirectory, i18n }),

    async loadAndPlayTrack(track: Track): Promise<void> {
      let file = fileHandles[track.uri];
      if (!file) {
        const confirmed = await confirm(
          t("webplayer:fileNotLoaded", { folder })
        );
        if (!confirmed) throw new Error("Re-selection cancelled");
        await pickDirectory();
        file = fileHandles[track.uri];
        if (!file) throw new Error("File not found after re-selection");
      }
      if (!track.metadataLoaded) {
        const metadata = await parseMetadata(track, fileHandles[track.uri]);
        host.updateMetadata([metadata]);
      }

      if (audio) {
        audio.pause();
        audio.src = "";
      }
      audio = new Audio(await URL.createObjectURL(file));
      audio.volume = host.getVolume() / 100;
      audio.muted = host.getMuted();
      return new Promise<void>((resolve, reject) => {
        if (audio) {
          audio.play().then(resolve).catch(reject);
        }
      });
    },

    async getTrackArtwork(track: Track) {
      if (track.artworkUri) return await fetchCoverArt(track.artworkUri);
    },

    pause() {
      audio?.pause();
    },

    resume() {
      audio?.play();
    },

    setVolume(volume: number) {
      audio!.volume = volume / 100;
    },

    setMuted(muted: boolean) {
      audio!.muted = muted;
    },

    setTime(position: number) {
      audio!.currentTime = position / 1000;
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "webplayer");
    }
  };
}
