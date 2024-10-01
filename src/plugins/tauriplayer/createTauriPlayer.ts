import { convertFileSrc, invoke } from "@tauri-apps/api/tauri";
import {
  SourceCallbacks,
  SourceHandle
} from "../../features/plugins/pluginsTypes";
import { open } from "@tauri-apps/api/dialog";
import { Track, TrackMetadata } from "../../features/tracks/tracksTypes";
import { appDataDir } from "@tauri-apps/api/path";
import { i18n } from "i18next";
import en_us from "./locales/en_us/translation.json";
import QuickStart from "./QuickStart";
import { Config } from "./Config";

export type TauriPlayerData = {
  folders: Record<string, string[]>;
};

export default function createTauriPlayer(
  host: SourceCallbacks,
  i18n: i18n
): SourceHandle {
  i18n.addResourceBundle("en-US", "tauriplayer", en_us);
  const { t } = i18n;
  const initialConfig = host.getData() as TauriPlayerData;
  let folders = { ...initialConfig.folders };
  let audio: HTMLAudioElement | null;
  console.log("Created a new tauri player");
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
        title: t("tauriplayer:chooseFolder")
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
              title: metadata.title,
              metadataLoaded: true,
              duration: parseNumber(metadata.duration),
              artist: JSON.parse(metadata.artist!),
              albumArtist: metadata.albumArtist,
              album: metadata.album,
              genre: JSON.parse(metadata.genre!),
              composer: JSON.parse(metadata.composer!),
              comments: JSON.parse(metadata.comments!),
              artworkUri: metadata.artworkUri,
              year: parseNumber(metadata.year),
              track: parseNumber(metadata.track),
              disc: parseNumber(metadata.disc),
              fileSize: parseNumber(metadata.fileSize),
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
        host.updateMetadata(
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
          metadataLoaded: false
        }) as Track
    );
    host.addTracks(tracks);
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
      t("tauriplayer:config.confirmRemove", {
        folder: folderPath
      })
    );
    if (!confirmed) return;
    host.removeTracks(folders[folderPath]);
    delete (folders = { ...folders })[folderPath];
    host.updateData({ folders: folders });
  }

  return {
    Config: (props) =>
      Config({ ...props, folders, addFolder, removeFolder, i18n }),

    QuickStart: (props) => QuickStart({ ...props, addFolder, i18n }),

    async loadAndPlayTrack(track: Track): Promise<void> {
      const file = await convertFileSrc(track.uri);
      if (!file) {
        if (!file) throw new Error("File not found");
      }
      if (!track.metadataLoaded) {
        getMetadata([track]);
      }

      if (audio) {
        audio.pause();
        audio.src = "";
      }
      audio = new Audio(file);
      audio.volume = host.getVolume() / 100;
      audio.muted = host.getMuted();
      return new Promise<void>((resolve, reject) => {
        if (audio) {
          audio.play().then(resolve).catch(reject);
        }
      });
    },

    async getTrackArtwork(track: Track) {
      if (track.artworkUri) {
        const directory = await appDataDir();
        return await convertFileSrc(
          directory + "/.artwork-cache/" + track.artworkUri
        );
      }
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
      console.log("disposing tauri player");
    }
  };
}
