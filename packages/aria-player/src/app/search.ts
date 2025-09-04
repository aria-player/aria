import Fuse from "fuse.js";
import { Track } from "../../../types/tracks";
import { ArtistDetails, AlbumDetails } from "../features/tracks/tracksTypes";

const fuseOptions = {
  threshold: 0.4,
  includeScore: true,
  shouldSort: true,
  useExtendedSearch: true,
  ignoreLocation: true
};

export const searchTracks = (tracks: Track[], search: string): Track[] => {
  if (!search.trim()) return [];
  const fuse = new Fuse(tracks, {
    keys: [
      { name: "title", weight: 5 },
      "artist",
      "albumArtist",
      "album",
      "genre",
      "composer",
      "comments"
    ],
    ...fuseOptions
  });
  const results = fuse.search(search);
  return results.map((result) => result.item);
};

export const searchArtists = (
  artists: ArtistDetails[],
  search: string
): ArtistDetails[] => {
  if (!search.trim()) return [];

  const fuse = new Fuse(artists, {
    keys: ["artist"],
    ...fuseOptions
  });

  return fuse.search(search).map((result) => result.item);
};

export const searchAlbums = (
  albums: AlbumDetails[],
  search: string
): AlbumDetails[] => {
  if (!search.trim()) return [];

  const fuse = new Fuse(albums, {
    keys: [{ name: "album", weight: 2 }, "artist"],
    ...fuseOptions
  });

  return fuse.search(search).map((result) => result.item);
};
