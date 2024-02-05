import { TrackId } from "../library/libraryTypes";

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
