import { ColumnVisibilityContextMenu } from "./ColumnVisibilityContextMenu";
import { SidebarItemContextMenu } from "./SidebarItemContextMenu";
import { SidebarLibraryContextMenu } from "./SidebarLibraryContextMenu";
import { SidebarPlaylistsContextMenu } from "./SidebarPlaylistsContextMenu";
import { TrackContextMenu } from "./TrackContextMenu";
import { TrackListItemContextMenu } from "./TrackListItemContextMenu";

export function ContextMenuContainer() {
  return (
    <>
      <ColumnVisibilityContextMenu />
      <SidebarLibraryContextMenu />
      <SidebarPlaylistsContextMenu />
      <SidebarItemContextMenu />
      <TrackListItemContextMenu />
      <TrackContextMenu />
    </>
  );
}
