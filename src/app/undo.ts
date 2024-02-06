import {
  moveLibraryItem,
  resetLibraryLayout,
  updateLibraryItem
} from "../features/library/librarySlice";
import {
  addTracksToPlaylist,
  createPlaylistItem,
  deletePlaylistItem,
  movePlaylistItem,
  removeTracksFromPlaylist,
  updatePlaylistItem
} from "../features/playlists/playlistsSlice";

export const undoableActions = [
  moveLibraryItem,
  updateLibraryItem,
  resetLibraryLayout,

  movePlaylistItem,
  updatePlaylistItem,
  createPlaylistItem,
  deletePlaylistItem,
  addTracksToPlaylist,
  removeTracksFromPlaylist
];
