import { parseBlob } from "music-metadata-browser";
import { TrackMetadata } from "../../features/library/libraryTypes";

export const getMetadata = async (track: TrackMetadata, file: File) => {
  const metadata = await parseBlob(file);
  const newTrack = { ...track };
  newTrack.duration = metadata.format.duration as number;
  if (metadata.native && metadata.native["ID3v2.3"]) {
    const ID3v23Data = new Map(
      metadata.native["ID3v2.3"].map((item) => [item.id, item.value])
    );
    const artists = metadata.native["ID3v2.3"]
      .filter((item) => item.id === "TPE1")
      .map((item) => item.value);
    newTrack.artist = artists.length > 1 ? artists : artists[0];
    newTrack.title = ID3v23Data.get("TIT2") as string;
    newTrack.albumartist = ID3v23Data.get("TPE2") as string;
    newTrack.album = ID3v23Data.get("TALB") as string;
    newTrack.genre = ID3v23Data.get("TCON") as string;
    newTrack.composer = ID3v23Data.get("TCOM") as string;
    newTrack.comments = ID3v23Data.get("COMM")
      ? ID3v23Data.get("COMM").text
      : null;
    newTrack.year = ID3v23Data.get("TYER") as number;
    newTrack.disc = Number(ID3v23Data.get("TPOS")?.split("/")[0]);
    newTrack.track = Number(ID3v23Data.get("TRCK")?.split("/")[0]);
  } else if (metadata.native && metadata.native.iTunes) {
    const iTunesData = new Map(
      metadata.native.iTunes.map((item) => [item.id, item.value])
    );
    const artists = iTunesData.get("\u00A9ART");
    newTrack.artist =
      artists && artists.includes("/") ? artists.split("/") : artists;
    newTrack.title = iTunesData.get("\u00A9nam") as string;
    newTrack.albumartist = iTunesData.get("aART") as string;
    newTrack.album = iTunesData.get("\u00A9alb") as string;
    newTrack.genre =
      (iTunesData.get("gnre") as string) ||
      (iTunesData.get("\u00A9gen") as string);
    newTrack.composer = iTunesData.get("\u00A9wrt") as string;
    newTrack.comments = iTunesData.get("\u00A9cmt") as string;
    newTrack.year = iTunesData.get("\u00A9day") as number;
    newTrack.disc = Number(iTunesData.get("disk")?.split("/")[0]);
    newTrack.track = Number(iTunesData.get("trkn")?.split("/")[0]);
  } else {
    newTrack.title = metadata.common.title || newTrack.title;
    newTrack.artist =
      metadata.common.artists ||
      (metadata.common.artist && [metadata.common.artist]) ||
      (metadata.common.albumartist && [metadata.common.albumartist]);
    newTrack.albumartist = metadata.common.albumartist;
    newTrack.album = metadata.common.album;
    newTrack.genre = metadata.common.genre?.join(", ");
    newTrack.composer = metadata.common.composer;
    newTrack.comments = metadata.common.comment;
    newTrack.year = metadata.common.year;
    newTrack.disc = Number(metadata.common.disk);
    newTrack.track = Number(metadata.common.track.no);
  }
  newTrack.metadataloaded = true;
  return newTrack;
};
