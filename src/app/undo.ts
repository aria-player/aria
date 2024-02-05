import {
  moveLibraryItem,
  resetLibraryLayout,
  updateLibraryItem
} from "../features/library/librarySlice";
import {
  createPlaylistItem,
  deletePlaylistItem,
  movePlaylistItem,
  updatePlaylistItem
} from "../features/playlists/playlistsSlice";

export const undoableActions = [
  moveLibraryItem,
  updateLibraryItem,
  resetLibraryLayout,

  movePlaylistItem,
  updatePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem
];
