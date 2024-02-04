import { Item, Menu } from "react-contexify";
import { useAppDispatch } from "../../app/hooks";
import { nanoid } from "@reduxjs/toolkit";
import { createPlaylistItem } from "../../features/playlists/playlistsSlice";

const id = "sidebarplaylists";

export function SidebarPlaylistsContextMenu() {
  const dispatch = useAppDispatch();

  return (
    <Menu
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      id={id}
      animation={false}
    >
      <Item
        onClick={() => {
          dispatch(
            createPlaylistItem({
              newData: {
                id: nanoid(),
                name: "New Playlist"
              }
            })
          );
        }}
      >
        Add new playlist
      </Item>
      <Item
        onClick={() => {
          dispatch(
            createPlaylistItem({
              newData: {
                id: nanoid(),
                name: "New Folder",
                children: []
              }
            })
          );
        }}
      >
        Add new playlist folder
      </Item>
    </Menu>
  );
}
