import { ColumnState } from "ag-grid-community";
import { TrackId } from "../../../../types/tracks";
import { DisplayMode, SplitViewState } from "../../app/view";
import { PluginId } from "../../../../types";

export type PlaylistId = string;
export type PlaylistItemId = string;

export interface PlaylistUndoable {
  id: PlaylistId;
  tracks: PlaylistItem[];
  provider?: PluginId;
}

export interface PlaylistConfig {
  id: PlaylistId;
  columnState: ColumnState[] | null;
  useCustomLayout: boolean;
  displayMode: DisplayMode;
  splitViewState: SplitViewState;
}

export interface PlaylistItem {
  itemId: PlaylistItemId;
  trackId: TrackId;
}
