import { parseBlob } from "music-metadata";
import { TrackMetadata } from "../../features/tracks/tracksTypes";
import localforage from "localforage";
import { expose } from "comlink";
import { SHA256 } from "crypto-js";

const artworkStore = localforage.createInstance({
  storeName: "webPlayerArtwork"
});

async function resizeArtwork(
  artworkBase64: string,
  maxWidth: number,
  maxHeight: number
): Promise<string> {
  const blob = await fetch(artworkBase64).then((res) => res.blob());
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(
    1,
    Math.min(maxWidth / bitmap.width, maxHeight / bitmap.height)
  );
  const canvas = new OffscreenCanvas(
    bitmap.width * scale,
    bitmap.height * scale
  );
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const resizedBlob = await canvas.convertToBlob({
    type: "image/jpeg",
    quality: 0.92
  });
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(resizedBlob);
  });
}

function chunkedUint8ArrayToBase64(uint8Array: Uint8Array) {
  let binaryString = "";
  const chunkSize = 32768;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    binaryString += String.fromCharCode.apply(null, [
      ...uint8Array.subarray(i, i + chunkSize)
    ]);
  }
  return btoa(binaryString);
}

async function storeCoverArtGetHash(coverArtData: string) {
  const coverArtHash = SHA256(coverArtData).toString();
  const existingData = await artworkStore.getItem(coverArtHash);

  if (!existingData) {
    // TODO: Awaiting this would slow down metadata scanning too much
    // Need to handle scenario where resizeArtwork doesn't finish before exit and a coverArtHash ends up with no data in artworkStore
    resizeArtwork(coverArtData, 1024, 1024).then((resizedCoverArtData) =>
      artworkStore.setItem(coverArtHash, resizedCoverArtData)
    );
  }

  return coverArtHash;
}

export async function fetchCoverArt(hash: string) {
  const coverArtData = await artworkStore.getItem(hash);
  return coverArtData as string;
}

export async function parseMetadata(track: TrackMetadata, file: File) {
  const metadata = await parseBlob(file);
  const newTrack = { ...track };
  newTrack.duration = (metadata.format.duration ?? 0) * 1000;
  if (metadata.common.picture && metadata.common.picture[0]) {
    const picture = metadata.common.picture[0];
    const pictureData = `data:${picture.format};base64,${chunkedUint8ArrayToBase64(picture.data)}`;
    const hash = await storeCoverArtGetHash(pictureData);
    if (hash != null) newTrack.artworkUri = hash;
  }
  if (metadata.native && metadata.native["ID3v2.3"]) {
    const ID3v23Data = new Map(
      metadata.native["ID3v2.3"].map((item) => [item.id, item.value])
    );
    const artists = metadata.native["ID3v2.3"]
      .filter((item) => item.id === "TPE1")
      .map((item) => item.value);
    newTrack.artist = artists.length > 1 ? artists : artists[0];
    newTrack.title = ID3v23Data.get("TIT2") || newTrack.title;
    newTrack.albumArtist = ID3v23Data.get("TPE2");
    newTrack.album = ID3v23Data.get("TALB");
    newTrack.genre = ID3v23Data.get("TCON");
    newTrack.composer = ID3v23Data.get("TCOM");
    newTrack.comments = ID3v23Data.get("COMM")
      ? ID3v23Data.get("COMM").text
      : null;
    newTrack.year = Number(ID3v23Data.get("TYER"));
    newTrack.disc = Number(ID3v23Data.get("TPOS")?.split("/")[0]);
    newTrack.track = Number(ID3v23Data.get("TRCK")?.split("/")[0]);
  } else if (metadata.native && metadata.native.iTunes) {
    const iTunesData = new Map(
      metadata.native.iTunes.map((item) => [item.id, item.value])
    );
    const artists = iTunesData.get("\u00A9ART");
    newTrack.artist =
      artists && artists.includes("/") ? artists.split("/") : artists;
    newTrack.title = iTunesData.get("\u00A9nam") || newTrack.title;
    newTrack.albumArtist = iTunesData.get("aART");
    newTrack.album = iTunesData.get("\u00A9alb");
    newTrack.genre = iTunesData.get("gnre") || iTunesData.get("\u00A9gen");
    newTrack.composer = iTunesData.get("\u00A9wrt");
    newTrack.comments = iTunesData.get("\u00A9cmt");
    newTrack.year = Number(iTunesData.get("\u00A9day"));
    newTrack.disc = Number(iTunesData.get("disk")?.split("/")[0]);
    newTrack.track = Number(iTunesData.get("trkn")?.split("/")[0]);
  } else {
    newTrack.title = metadata.common.title || newTrack.title;
    newTrack.artist =
      metadata.common.artists ||
      (metadata.common.artist && [metadata.common.artist]) ||
      (metadata.common.albumartist && [metadata.common.albumartist]);
    newTrack.albumArtist = metadata.common.albumartist;
    newTrack.album = metadata.common.album;
    newTrack.genre = metadata.common.genre?.join(", ");
    newTrack.composer = metadata.common.composer;
    newTrack.comments = metadata.common.comment
      ?.map((comment) => comment.text)
      .filter((text) => text !== undefined);
    newTrack.year = Number(metadata.common.year);
    newTrack.disc = Number(metadata.common.disk);
    newTrack.track = Number(metadata.common.track.no);
  }
  newTrack.metadataLoaded = true;
  return newTrack;
}

expose({
  fetchCoverArt,
  parseMetadata
});