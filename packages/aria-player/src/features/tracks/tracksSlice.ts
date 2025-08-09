import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { setupTracksListeners } from "./tracksListeners";
import { Track, TrackId } from "../../../../types/tracks";
import { PluginId } from "../../../../types/plugins";
import { PlaylistItem } from "../playlists/playlistsTypes";
import { ArtistDetails, AlbumDetails } from "./tracksTypes";
import { LibraryView, TrackGrouping } from "../../app/view";
import { getMostCommonArtworkUri } from "../../app/utils";

const tracksAdapter = createEntityAdapter<Track, TrackId>({
  selectId: (track) => track.trackId,
  sortComparer: (a, b) => b.dateAdded - a.dateAdded
});

interface TracksState {
  tracks: EntityState<Track, TrackId>;
  selectedTracks: PlaylistItem[];
  clipboard: PlaylistItem[];
}

const initialState: TracksState = {
  tracks: tracksAdapter.getInitialState(),
  selectedTracks: [],
  clipboard: []
};

const tracksSlice = createSlice({
  name: "tracks",
  initialState,
  reducers: {
    addTracks: (
      state,
      action: PayloadAction<{ source: PluginId; tracks?: Track[] }>
    ) => {
      tracksAdapter.upsertMany(
        state.tracks,
        action.payload.tracks?.map((track) => ({
          ...track,
          albumId:
            track.albumId ?? `${track.album ?? ""} ${track.albumArtist ?? ""}`
        })) ?? []
      );
    },
    removeTracks: (
      state,
      action: PayloadAction<{ source: PluginId; tracks?: TrackId[] }>
    ) => {
      const tracksToFilter = action.payload.tracks ?? state.tracks.ids;
      const tracksToRemove = tracksToFilter.filter(
        (trackId) =>
          state.tracks.entities[trackId]?.source === action.payload.source
      );
      tracksAdapter.removeMany(state.tracks, tracksToRemove);
    },
    setSelectedTracks: (state, action: PayloadAction<PlaylistItem[]>) => {
      state.selectedTracks = action.payload;
    },
    copySelectedTracks: (state) => {
      state.clipboard = state.selectedTracks;
    }
  }
});

export const {
  addTracks,
  removeTracks,
  setSelectedTracks,
  copySelectedTracks
} = tracksSlice.actions;

export const {
  selectIds: selectTrackIds,
  selectAll: selectAllTracks,
  selectById: selectTrackById
} = tracksAdapter.getSelectors((state: RootState) => state.tracks.tracks);
export const selectSelectedTracks = (state: RootState) =>
  state.tracks.selectedTracks;
export const selectClipboard = (state: RootState) => state.tracks.clipboard;

export const selectAllArtists = createSelector(
  [
    (state: RootState) => state.tracks.tracks.entities,
    (state: RootState) => state.undoable.present.library.splitViewStates
  ],
  (tracksById, librarySplitViewStates) => {
    const artistGrouping =
      librarySplitViewStates[LibraryView.Artists].trackGrouping;
    const artistsMap = new Map<string, ArtistDetails>();
    Object.values(tracksById).forEach((track) => {
      if (!track) return;
      const artists = (
        artistGrouping == TrackGrouping.AlbumArtist
          ? [track.albumArtist]
          : Array.isArray(track.artist)
            ? track.artist
            : [track.artist]
      ).filter((artist): artist is string => Boolean(artist));
      artists.forEach((artist) => {
        if (!artistsMap.has(artist)) {
          artistsMap.set(artist, { artist, firstTrack: track });
        }
      });
    });

    return Array.from(artistsMap.values()).sort((a, b) =>
      a.artist.localeCompare(b.artist)
    );
  }
);

export const selectAllAlbums = createSelector(
  [(state: RootState) => state.tracks.tracks.entities],
  (tracksById) => {
    const albumsMap = new Map<string, AlbumDetails>();
    const tracks = Object.values(tracksById);
    tracks.forEach((track) => {
      if (!track?.albumId || !track.album) return;
      if (!albumsMap.has(track.albumId)) {
        const albumTracks = tracks.filter((t) => t.albumId === track.albumId);
        albumsMap.set(track.albumId, {
          albumId: track.albumId,
          album: track.album,
          artist:
            track.albumArtist ||
            (Array.isArray(track.artist) ? track.artist[0] : track.artist),
          firstTrack: {
            ...track,
            artworkUri: getMostCommonArtworkUri(albumTracks)
          }
        });
      }
    });

    return Array.from(albumsMap.values()).sort((a, b) =>
      a.album.localeCompare(b.album)
    );
  }
);

export default tracksSlice.reducer;

setupTracksListeners();
