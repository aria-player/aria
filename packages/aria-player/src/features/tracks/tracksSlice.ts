import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSelector,
  createSlice
} from "@reduxjs/toolkit";
import { RootState, store } from "../../app/store";
import { setupTracksListeners } from "./tracksListeners";
import { Track, TrackId, Artist, ArtistId } from "../../../../types/tracks";
import { PluginId } from "../../../../types/plugins";
import { PlaylistItem } from "../playlists/playlistsTypes";
import { ArtistDetails, AlbumDetails } from "./tracksTypes";
import {
  getMostCommonArtworkUri,
  getAsArray,
  getArtistId
} from "../../app/utils";

const tracksAdapter = createEntityAdapter<Track, TrackId>({
  selectId: (track) => track.trackId,
  sortComparer: (a, b) => b.dateAdded - a.dateAdded
});

interface TracksState {
  tracks: EntityState<Track, TrackId>;
  artists: Record<ArtistId, Artist>;
  selectedTracks: PlaylistItem[];
  clipboard: PlaylistItem[];
}

const initialState: TracksState = {
  tracks: tracksAdapter.getInitialState(),
  artists: {},
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
            track.albumId ??
            `${track.album ?? ""} ${
              Array.isArray(track.albumArtist)
                ? track.albumArtist.join(" ")
                : (track.albumArtist ?? "")
            }`
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
    addArtists: (
      state,
      action: PayloadAction<{ source: PluginId; artists: Artist[] }>
    ) => {
      action.payload.artists.forEach((artist) => {
        state.artists[artist.artistId] = artist;
      });
    },
    removeArtists: (
      state,
      action: PayloadAction<{ source: PluginId; artists?: ArtistId[] }>
    ) => {
      const { artists } = action.payload;
      if (artists) {
        artists.forEach((id) => delete state.artists[id]);
      } else {
        Object.keys(state.artists).forEach((id) => {
          if (state.artists[id].source === action.payload.source) {
            delete state.artists[id];
          }
        });
      }
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
  addArtists,
  removeArtists,
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
export const selectArtistsInfo = (state: RootState) => state.tracks.artists;
export const selectArtistInfo = (state: RootState, artistId: ArtistId) =>
  state.tracks.artists[artistId];

export const selectAllArtists = createSelector(
  [
    (state: RootState) => state.tracks.tracks.entities,
    (state: RootState) => state.tracks.artists
  ],
  (tracksById) => {
    const state = store.getState();
    const artistsMap = new Map<string, ArtistDetails>();
    Object.values(tracksById).forEach((track) => {
      if (!track) return;
      const artists = getAsArray(track.artist);
      const artistUris = getAsArray(track.artistUri);
      const albumArtists = getAsArray(track.albumArtist);
      const albumArtistUris = getAsArray(track.albumArtistUri);
      [
        ...artists.map((name, index) => ({
          name,
          id: artistUris[index]
            ? getArtistId(track.source, artistUris[index])
            : undefined
        })),
        ...albumArtists.map((name, index) => ({
          name,
          id: albumArtistUris[index]
            ? getArtistId(track.source, albumArtistUris[index])
            : undefined
        }))
      ].forEach(({ name, id }) => {
        const key = id || name;
        if (!artistsMap.has(key)) {
          artistsMap.set(key, {
            ...(id ? selectArtistInfo(state, id) : {}),
            artistId: id || name,
            name,
            firstTrack: track
          });
        }
      });
    });

    return Array.from(artistsMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
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
          artist: track.albumArtist || track.artist,
          artistUri: track.albumArtistUri || track.artistUri,
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
