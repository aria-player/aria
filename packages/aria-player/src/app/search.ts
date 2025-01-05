import { Track } from "../features/tracks/tracksTypes";

export const searchTracks = (tracks: Track[], search: string): Track[] => {
  // TODO: More elaborate search result sorting (e.g. prioritising whole word matches)
  const searchLowercase = search.toLowerCase();
  return tracks
    .filter((track) => {
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
        .some((value) => value?.toLowerCase().includes(searchLowercase));
    })
    .sort((a, b) =>
      a.title.toLowerCase().includes(searchLowercase)
        ? -1
        : b.title.toLowerCase().includes(searchLowercase)
          ? 1
          : 0
    );
};
