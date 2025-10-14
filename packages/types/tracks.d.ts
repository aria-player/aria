import { PluginId } from "./plugins";

export type TrackId = string;
export type AlbumId = string;
export type TrackUri = string;
export type AlbumUri = string;

/**
 * Metadata describing a track that can be provided by the track source.
 */
export interface TrackMetadata {
  /**
   * Unique identifier for this track within its source.
   */
  uri: TrackUri;
  /**
   * The title of this track.
   */
  title: string;
  /**
   * Whether the metadata for this track is fully loaded.
   *
   * If set to `false`, this track will still appear in the library, but a progress indicator will appear until all metadata is loaded.
   */
  metadataLoaded: boolean;
  /**
   * The date this track was added to the source library, in number of milliseconds since epoch.
   *
   * If not applicable, set to `Date.now()` when passing new tracks to `addTracks`.
   */
  dateAdded: number;
  /**
   * The date that the metadata for this track was last modified, in number of milliseconds since epoch.
   */
  dateModified?: number;
  /**
   * The duration of this track in milliseconds.
   */
  duration?: number;
  /**
   * The name of the artist(s) for this track.
   */
  artist?: string | string[];
  /**
   * Optional identifier(s) for this track's artist(s).
   *
   * Providing `artistUri` values will allow the player to distinguish artists with the same name.
   */
  artistUri?: string | string[];
  /**
   * The artist(s) of the album this track is part of.
   */
  albumArtist?: string | string[];
  /**
   * Optional identifier(s) for this track's album artist(s).
   *
   * Providing `albumArtistUri` values will allow the player to distinguish artists with the same name.
   */
  albumArtistUri?: string | string[];
  /**
   * The name of the album this track is part of.
   */
  album?: string;
  /**
   * Optional identifier for this track's album. If not provided, albums will be distinguished by a combination of the `album` and `albumArtist` fields.
   *
   * Providing a unique `albumUri` allows the player to always distinguish albums, e.g. if an artist has multiple albums with the same name.
   */
  albumUri?: AlbumUri;
  /**
   * The genre(s) associated with this track.
   */
  genre?: string | string[];
  /**
   * The composer(s) associated with this track.
   */
  composer?: string | string[];
  /**
   * Any comments or notes associated with this track.
   */
  comments?: string | string[];
  /**
   * The year this track's album was released.
   */
  year?: number;
  /**
   * The number of this track within its album.
   */
  track?: number;
  /**
   * The number of the disc this track is from, for multi-disc albums.
   */
  disc?: number;
  /**
   * The path where this track is stored, if the source uses a filesystem.
   */
  filePath?: string;
  /**
   * The folder where this track is stored, if the source uses a filesystem.
   */
  fileFolder?: string;
  /**
   * The file size of this track in bytes, if the source uses a filesystem.
   */
  fileSize?: number;
  /**
   * The file format of this track, e.g. 'MP3'.
   */
  fileFormat?: string;
  /**
   * The sample rate of this track in hertz.
   */
  sampleRate?: number;
  /**
   * The bit rate of this track in bits per second.
   */
  bitRate?: number;
  /**
   * A unique identifier for the artwork associated with this track.
   */
  artworkUri?: string;
}

/**
 * A complete track object including data assigned by the player.
 */
export interface Track extends TrackMetadata {
  /**
   * Unique identifier for this track.
   */
  trackId: TrackId;
  /**
   * Unique identifier for the album this track is part of, if available.
   */
  albumId?: AlbumId;
  /**
   * The ID of the source plugin that provides this track.
   */
  source: PluginId;
}
