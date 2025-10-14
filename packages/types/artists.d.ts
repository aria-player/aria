import { PluginId } from "./plugins";

export type ArtistId = string;
export type ArtistUri = string;

/**
 * Metadata describing an artist that can be provided by a source.
 */
export interface ArtistMetadata {
  /**
   * Unique identifier for this artist within its source.
   */
  uri: ArtistUri;
  /**
   * The name of this artist.
   */
  name: string;
  /**
   * A unique identifier for the artwork associated with this artist.
   */
  artworkUri?: string;
}

/**
 * A complete artist object including data assigned by the player.
 */
export interface Artist extends ArtistMetadata {
  /**
   * Unique identifier for this artist.
   */
  artistId: ArtistId;
  /**
   * The ID of the source plugin that provides this artist.
   */
  source: PluginId;
}
