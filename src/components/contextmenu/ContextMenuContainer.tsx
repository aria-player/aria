import { TrackListHeaderContextMenu } from "./TrackListHeaderContextMenu";
import { SidebarItemContextMenu } from "./SidebarItemContextMenu";
import { SidebarLibraryContextMenu } from "./SidebarLibraryContextMenu";
import { SidebarPlaylistsContextMenu } from "./SidebarPlaylistsContextMenu";
import { TrackContextMenu } from "./TrackContextMenu";
import { TrackListItemContextMenu } from "./TrackListItemContextMenu";

export function ContextMenuContainer() {
  return (
    <>
      <TrackListHeaderContextMenu />
      <SidebarLibraryContextMenu />
      <SidebarPlaylistsContextMenu />
      <SidebarItemContextMenu />
      <TrackListItemContextMenu />
      <TrackContextMenu />
    </>
  );
}
