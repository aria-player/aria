import { TrackId } from "../tracks/tracksTypes";

export type PlaylistId = string;
export type PlaylistItemId = string;

export interface Playlist {
  id: PlaylistId;
  tracks: PlaylistItem[];
}

export interface PlaylistItem {
  itemId: PlaylistItemId;
  trackId: TrackId;
}
