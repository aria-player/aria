import { Track, TrackMetadata, TrackUri } from "../../../../types/tracks";
import { SourceCallbacks, SourceHandle } from "../../../../types/plugins";
import { LibraryConfig } from "./LibraryConfig";
import { wrap } from "comlink";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import QuickStart from "./QuickStart";
import { createWebAudioBackend } from "../../app/audio";

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
  i18n.addResourceBundle("en-US", "web-player", en_us);
  const { t } = i18n;
  const initialConfig = host.getData() as WebPlayerData | null;
  const webAudioBackend = createWebAudioBackend({
    onFinishedPlayback: () => {
      host.finishPlayback();
    }
  });
  const metadataWorker = new Worker(
    new URL("./metadataWorker.ts", import.meta.url),
    { type: "module" }
  );
  const { fetchCoverArt, parseMetadata } =
    wrap<typeof import("./metadataWorker")>(metadataWorker);

  let folder = initialConfig?.folder;
  let fileHandles: { [key: TrackUri]: File } = {};
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
      host.updateTracks(newMetadata);
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
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && ["mp3", "wav", "flac", "ogg", "m4a", "aac"].includes(ext)) {
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
    displayName: t("web-player:localFiles"),

    disableAutomaticTrackSkip: true,

    LibraryConfig: (props) =>
      LibraryConfig({ ...props, host, loaded, pickDirectory, i18n }),

    QuickStart: (props) => QuickStart({ ...props, pickDirectory, i18n }),

    async loadAndPlayTrack(track: Track): Promise<void> {
      let file = fileHandles[track.uri];
      if (!file) {
        const confirmed = await confirm(
          t("web-player:fileNotLoaded", { folder })
        );
        if (!confirmed) throw new Error("Re-selection cancelled");
        await pickDirectory();
        file = fileHandles[track.uri];
        if (!file) throw new Error("File not found after re-selection");
      }
      if (!track.metadataLoaded) {
        const metadata = await parseMetadata(track, fileHandles[track.uri]);
        host.updateTracks([metadata]);
      }
      const actualDuration = await webAudioBackend.loadPrimaryAudioFile(
        track.uri,
        URL.createObjectURL(file),
        host.getVolume()
      );
      if (actualDuration != null && actualDuration != track.duration) {
        host.updateTracks([{ ...track, duration: actualDuration }]);
      }
    },

    setTrackToPreload(track: Track | null) {
      webAudioBackend.clearSecondaryAudioFile();
      if (!track) {
        return;
      }
      const file = fileHandles[track.uri];
      if (!file) return;
      webAudioBackend.loadSecondaryAudioFile(
        track.uri,
        URL.createObjectURL(file)
      );
    },

    async getTrackArtwork(track: Track) {
      if (track.artworkUri) return await fetchCoverArt(track.artworkUri);
    },

    pause() {
      webAudioBackend.pause();
    },

    resume() {
      webAudioBackend.resume();
    },

    setVolume(volume: number) {
      webAudioBackend.setVolume(volume / 100);
    },

    setMuted(muted: boolean) {
      webAudioBackend.setVolume(muted ? 0 : host.getVolume() / 100);
    },

    setTime(position: number) {
      webAudioBackend.setTime(position);
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "web-player");
      webAudioBackend?.dispose();
    }
  };
}
