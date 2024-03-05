import { ColumnState } from "@ag-grid-community/core";
import { TrackId } from "../tracks/tracksTypes";
import { DisplayMode, TrackGrouping } from "../../app/view";

export type PlaylistId = string;
export type PlaylistItemId = string;

export interface PlaylistUndoable {
  id: PlaylistId;
  tracks: PlaylistItem[];
}

export interface PlaylistConfig {
  id: PlaylistId;
  columnState: ColumnState[] | null;
  useCustomLayout: boolean;
  displayMode: DisplayMode;
  splitViewSizes: number[] | null;
  trackGrouping: TrackGrouping | null;
  selectedGroup: string | null;
}

export interface PlaylistItem {
  itemId: PlaylistItemId;
  trackId: TrackId;
}
