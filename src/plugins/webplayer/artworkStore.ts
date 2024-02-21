import CryptoJS from "crypto-js";
import localforage from "localforage";

export const artworkStore = localforage.createInstance({
  storeName: "webPlayerArtwork"
});

export async function storeCoverArtGetHash(coverArtData: string) {
  const coverArtHash = CryptoJS.SHA256(coverArtData).toString();
  const existingData = await artworkStore.getItem(coverArtHash);

  if (!existingData) {
    await artworkStore.setItem(coverArtHash, coverArtData);
  }

  return coverArtHash;
}

export async function getCoverArt(hash: string) {
  const coverArtData = await artworkStore.getItem(hash);
  return coverArtData as string;
}
