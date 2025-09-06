import Fuse from "fuse.js";
import { Track } from "../../../types/tracks";
import { ArtistDetails, AlbumDetails } from "../features/tracks/tracksTypes";

const fuseOptions = {
  threshold: 0.3,
  includeScore: true,
  shouldSort: true,
  useExtendedSearch: true,
  ignoreLocation: true
};

let tracksFuse: Fuse<Track> | null = null;
let artistsFuse: Fuse<ArtistDetails> | null = null;
let albumsFuse: Fuse<AlbumDetails> | null = null;

export function invalidateSearchCache() {
  tracksFuse = null;
  artistsFuse = null;
  albumsFuse = null;
}

export const searchTracks = (tracks: Track[], search: string): Track[] => {
  if (!search.trim()) return [];
  if (!tracksFuse) {
    tracksFuse = new Fuse(tracks, {
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
  }
  const results = tracksFuse.search(search);
  return results.map((result) => result.item);
};

export const searchArtists = (
  artists: ArtistDetails[],
  search: string
): ArtistDetails[] => {
  if (!search.trim()) return [];
  if (!artistsFuse) {
    artistsFuse = new Fuse(artists, {
      keys: ["artist"],
      ...fuseOptions
    });
  }
  return artistsFuse.search(search).map((result) => result.item);
};

export const searchAlbums = (
  albums: AlbumDetails[],
  search: string
): AlbumDetails[] => {
  if (!search.trim()) return [];
  if (!albumsFuse) {
    albumsFuse = new Fuse(albums, {
      keys: [{ name: "album", weight: 2 }, "artist"],
      ...fuseOptions
    });
  }
  return albumsFuse.search(search).map((result) => result.item);
};
