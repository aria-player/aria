import { Track } from "../features/tracks/tracksTypes";

export const searchTracks = (tracks: Track[], search: string): Track[] => {
  return tracks.filter((track) => {
    return [
      track.title,
      track.artist,
      track.albumArtist,
      track.album,
      track.genre,
      track.composer,
      track.comments
    ]
      .flat()
      .some((value) => value?.toLowerCase().includes(search.toLowerCase()));
  });
};
