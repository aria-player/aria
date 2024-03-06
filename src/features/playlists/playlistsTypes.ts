import { ColumnState } from "@ag-grid-community/core";
import { TrackId } from "../tracks/tracksTypes";
import { DisplayMode, SplitViewState } from "../../app/view";

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
  selectedAlbum: string | null;
  splitViewState: SplitViewState;
}

export interface PlaylistItem {
  itemId: PlaylistItemId;
  trackId: TrackId;
}
