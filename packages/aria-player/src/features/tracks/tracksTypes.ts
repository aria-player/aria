import { Artist, Track } from "../../../../types/tracks";

/**
 * An instance of a track in a list where the same track can appear twice, e.g. a playlist or the queue.
 */
export interface TrackListItem extends Track {
  /**
   * Unique identifier for this track list item.
   */
  itemId: string;
}

export type ArtistDetails = Partial<Artist> & {
  artistId: string;
  name: string;
  source: string;
  artworkUri?: string;
  firstTrackArtworkUri?: string;
};

export interface AlbumDetails {
  albumId: string;
  album: string;
  artist?: string | string[];
  artistUri?: string | string[];
  source: string;
  artworkUri?: string;
}
