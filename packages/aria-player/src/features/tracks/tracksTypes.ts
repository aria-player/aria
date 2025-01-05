import { Track } from "../../../../types/tracks";

/**
 * An instance of a track in a list where the same track can appear twice, e.g. a playlist or the queue.
 */
export interface TrackListItem extends Track {
  /**
   * Unique identifier for this track list item.
   */
  itemId: string;
}
