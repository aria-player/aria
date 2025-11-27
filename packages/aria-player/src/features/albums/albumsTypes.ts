export interface AlbumDetails {
  albumId: string;
  album: string;
  artist?: string | string[];
  artistUri?: string | string[];
  source: string;
  artworkUri?: string;
}
