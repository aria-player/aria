import { ColumnState } from "@ag-grid-community/core";
import { TrackId } from "../tracks/tracksTypes";

export type PlaylistId = string;
export type PlaylistItemId = string;

export interface PlaylistUndoable {
  id: PlaylistId;
  tracks: PlaylistItem[];
}

export interface PlaylistConfig {
  id: PlaylistId;
  columnState: ColumnState[];
}

export interface PlaylistItem {
  itemId: PlaylistItemId;
  trackId: TrackId;
}
