import Fuse from "fuse.js";
import { Track } from "../../../types/tracks";
import { ArtistDetails, AlbumDetails } from "../features/tracks/tracksTypes";

export interface SearchResult {
  type: "track" | "artist" | "album";
  item: Track | ArtistDetails | AlbumDetails;
  score: number;
}

const fuseOptions = {
  threshold: 0.3,
  includeScore: true,
  shouldSort: true,
  useExtendedSearch: true,
  ignoreLocation: true
};

const tracksOptions = {
  keys: [
    { name: "title", weight: 3 },
    "artist",
    "albumArtist",
    "album",
    "genre",
    "composer",
    "comments"
  ],
  ...fuseOptions
};

const artistsOptions = {
  keys: [{ name: "artist", weight: 5 }],
  ...fuseOptions
};

const albumsOptions = {
  keys: [
    { name: "album", weight: 5 },
    { name: "artist", weight: 3 }
  ],
  ...fuseOptions
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
    tracksFuse = new Fuse(tracks, tracksOptions);
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
    artistsFuse = new Fuse(artists, artistsOptions);
  }
  return artistsFuse.search(search).map((result) => result.item);
};

export const searchAlbums = (
  albums: AlbumDetails[],
  search: string
): AlbumDetails[] => {
  if (!search.trim()) return [];
  if (!albumsFuse) {
    albumsFuse = new Fuse(albums, albumsOptions);
  }
  return albumsFuse.search(search).map((result) => result.item);
};

export const searchAllCategories = (
  tracks: Track[],
  artists: ArtistDetails[],
  albums: AlbumDetails[],
  search: string
): null | {
  tracks: SearchResult[];
  artists: SearchResult[];
  albums: SearchResult[];
} => {
  if (!search.trim()) return null;
  if (!tracksFuse || !artistsFuse || !albumsFuse) {
    tracksFuse = new Fuse(tracks, tracksOptions);
    artistsFuse = new Fuse(artists, artistsOptions);
    albumsFuse = new Fuse(albums, albumsOptions);
  }
  return {
    tracks: tracksFuse.search(search).map((result) => ({
      type: "track",
      item: result.item,
      score: result.score ?? 0
    })),
    artists: artistsFuse.search(search).map((result) => ({
      type: "artist",
      item: result.item,
      score: result.score ?? 0
    })),
    albums: albumsFuse.search(search).map((result) => ({
      type: "album",
      item: result.item,
      score: result.score ?? 0
    }))
  };
};
