import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { SourceCallbacks, SourceHandle } from "../../../../types/plugins";
import { open } from "@tauri-apps/plugin-dialog";
import { Track, TrackMetadata } from "../../../../types/tracks";
import { appDataDir } from "@tauri-apps/api/path";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import QuickStart from "./QuickStart";
import { LibraryConfig } from "./LibraryConfig";
import { createWebAudioBackend } from "../../app/audio";

export type TauriPlayerData = {
  folders: Record<string, string[]>;
};

export default function createTauriPlayer(
  host: SourceCallbacks,
  i18n: i18n
): SourceHandle {
  i18n.addResourceBundle("en-US", "tauri-player", en_us);
  const { t } = i18n;
  const initialConfig = host.getData() as TauriPlayerData;
  const webAudioBackend = createWebAudioBackend({
    onFinishedPlayback: () => {
      host.finishPlayback();
    }
  });
  let folders = { ...initialConfig.folders };
  rescanFolders();
  getMetadata(host.getTracks().filter((track) => !track.metadataLoaded));

  async function getAudioFileNames(directoryPath: string) {
    try {
      return await invoke("get_audio_files_from_directory", { directoryPath });
    } catch (error) {
      console.error("Error getting files:", error);
    }
  }

  async function pickDirectory(): Promise<
    { path: string; items: string[] } | undefined
  > {
    try {
      const selectedDirectory = (await open({
        directory: true,
        title: t("tauri-player:chooseFolder")
      })) as string | null | undefined;

      if (!selectedDirectory) return;
      const fileNames = await getAudioFileNames(selectedDirectory);

      return {
        path: selectedDirectory,
        items: fileNames as string[]
      };
    } catch (error) {
      console.error("Error picking directory:", error);
    }
  }

  async function getMetadata(tracks: Track[]) {
    function parseNumber(value: string | undefined): number | undefined {
      const parsedValue = parseInt(value ?? "0", 10);
      return parsedValue !== 0 ? parsedValue : undefined;
    }
    for (let i = 0; i < tracks.length; i += 10) {
      const batch = tracks.slice(i, i + 10);
      const metadataPromises = batch.map((track) =>
        invoke("get_metadata", { filePath: track.uri })
          .then((result: unknown) => {
            const metadata = result as Partial<Record<keyof Track, string>>;
            return {
              uri: track.uri,
              title: metadata.title || track.title,
              metadataLoaded: true,
              duration: parseNumber(metadata.duration),
              artist: metadata.artist && JSON.parse(metadata.artist),
              albumArtist: metadata.albumArtist,
              album: metadata.album,
              genre: metadata.genre && JSON.parse(metadata.genre),
              composer: metadata.composer && JSON.parse(metadata.composer),
              comments: metadata.comments && JSON.parse(metadata.comments),
              artworkUri: metadata.artworkUri,
              year: parseNumber(metadata.year),
              dateReleased: parseNumber(metadata.dateReleased),
              track: parseNumber(metadata.track),
              disc: parseNumber(metadata.disc),
              fileSize: parseNumber(metadata.fileSize),
              sampleRate: parseNumber(metadata.sampleRate),
              bitRate: parseNumber(metadata.bitRate),
              dateModified: parseNumber(metadata.dateModified)
            } as Track;
          })
          .catch((err) => {
            console.error(`Error fetching metadata for ${track.uri}:`, err);
            return {
              ...track,
              metadataLoaded: true
            } as Track;
          })
      );

      const batchMetadata = (await Promise.all(metadataPromises)).filter(
        (m) => m !== null
      );

      if (batchMetadata.length > 0) {
        host.updateLibraryTracks(
          batchMetadata.filter((item) => item != null) as TrackMetadata[]
        );
      }
    }
  }

  function addNewTracks(fileNames: string[]) {
    const dateAdded = Date.now();
    const tracks = fileNames.map(
      (fileName) =>
        ({
          uri: fileName,
          title: fileName.split("\\").pop(),
          album: fileName.split("\\").slice(-2, -1)[0],
          dateAdded,
          filePath: fileName,
          fileFolder: fileName.split("\\").slice(-2, -1)[0],
          fileFormat: fileName.split(".").pop()?.toUpperCase(),
          metadataLoaded: false
        }) as Track
    );
    host.addLibraryTracks(tracks);
    getMetadata(tracks);
  }

  async function rescanFolders() {
    for (const folder in folders) {
      const fileNames = (await getAudioFileNames(folder)) as string[];
      const newFileNames = fileNames.filter(
        (fileName) => !folders[folder].includes(fileName)
      );
      if (newFileNames.length > 0) {
        folders[folder] = [...folders[folder], ...newFileNames];
        host.updateData({ folders });
        addNewTracks(newFileNames);
      }
    }
  }

  const addFolder = async () => {
    pickDirectory().then(async (folderInfo) => {
      if (folderInfo) {
        folders = { ...folders, [folderInfo.path]: folderInfo.items };
        host.updateData({ folders });
        addNewTracks(folderInfo.items);
      }
    });
  };

  async function removeFolder(folderPath: string) {
    const confirmed = await confirm(
      t("tauri-player:config.confirmRemove", {
        folder: folderPath
      })
    );
    if (!confirmed) return;
    host.removeLibraryTracks(folders[folderPath]);
    delete (folders = { ...folders })[folderPath];
    host.updateData({ folders: folders });
  }

  return {
    displayName: t("tauri-player:localFiles"),

    disableAutomaticTrackSkip: true,

    LibraryConfig: (props) =>
      LibraryConfig({ ...props, folders, addFolder, removeFolder, i18n }),

    QuickStart: (props) => QuickStart({ ...props, addFolder, i18n }),

    async loadAndPlayTrack(track: Track) {
      const file = convertFileSrc(track.uri);
      if (!file) throw new Error("File not found");
      const actualDuration = await webAudioBackend.loadPrimaryAudioFile(
        track.uri,
        file,
        host.getMuted() ? 0 : host.getVolume() / 100
      );
      if (actualDuration != null && actualDuration != track.duration) {
        host.updateLibraryTracks([{ ...track, duration: actualDuration }]);
      }
    },

    setTrackToPreload(track: Track | null) {
      webAudioBackend.clearSecondaryAudioFile();
      if (!track) {
        return;
      }
      const file = convertFileSrc(track.uri);
      if (!file) return;
      webAudioBackend.loadSecondaryAudioFile(track.uri, file);
    },

    async getTrackArtwork(artworkUri) {
      if (artworkUri) {
        const directory = await appDataDir();
        return await convertFileSrc(
          directory + "/.artwork-cache/" + artworkUri
        );
      }
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

    getCustomTrackActions: (track: Track) => {
      return [
        {
          label: t("tauri-player:showInFileManager"),
          onClick: () => {
            invoke("show_file_in_manager", { uri: track.uri });
          }
        }
      ];
    },

    dispose() {
      i18n.removeResourceBundle("en-US", "tauri-player");
      webAudioBackend?.dispose();
    }
  };
}
