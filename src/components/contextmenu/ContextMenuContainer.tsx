import { ColumnVisibilityContextMenu } from "./ColumnVisibilityContextMenu";
import { SidebarLibraryContextMenu } from "./SidebarLibraryContextMenu";
import { SidebarPlaylistsContextMenu } from "./SidebarPlaylistsContextMenu";

export function ContextMenuContainer() {
  return (
    <>
      <ColumnVisibilityContextMenu />
      <SidebarLibraryContextMenu />
      <SidebarPlaylistsContextMenu />
    </>
  );
}
