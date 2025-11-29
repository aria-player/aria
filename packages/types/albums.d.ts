import { ArtistUri } from "./artists";
import { PluginId } from "./plugins";

export type AlbumId = string;
export type AlbumUri = string;

/**
 * Metadata describing an album that can be provided by a source.
 */
export interface AlbumMetadata {
  /**
   * Unique identifier for this album within its source.
   */
  uri: AlbumUri;
  /**
   * The name of this album.
   */
  name: string;
  /**
   * The artist(s) of the album.
   */
  artist?: string | string[];
  /**
   * Optional identifier(s) for this album's artist(s).
   */
  artistUri?: ArtistUri | ArtistUri[];
  /**
   * A unique identifier for the artwork associated with this album.
   */
  artworkUri?: string;
  /**
   * The year this album was released.
   */
  year?: number;
  /**
   * The date this album was released, in milliseconds since epoch.
   */
  dateReleased?: number;
}

/**
 * A complete album object including data assigned by the player.
 */
export interface Album extends AlbumMetadata {
  /**
   * Unique identifier for this album.
   */
  albumId: AlbumId;
  /**
   * The ID of the source plugin that provides this album.
   */
  source: PluginId;
}
