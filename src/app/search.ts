import { Track } from "../features/tracks/tracksTypes";

export const searchTracks = (tracks: Track[], search: string): Track[] => {
  return tracks.filter((track) => {
    return Object.values(track).flat().some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(search.toLowerCase())
    );
  });
};
