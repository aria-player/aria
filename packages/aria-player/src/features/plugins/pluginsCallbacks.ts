import { store } from "../../app/store";
import {
  getAlbumId,
  getArtistId,
  getAsArray,
  getTrackId
} from "../../app/utils";
import {
  addTracks,
  removeTracks,
  selectAllTracks,
  selectTrackById
} from "../tracks/tracksSlice";
import {
  selectActivePlugins,
  setPluginData,
  setSourceSyncProgress
} from "./pluginsSlice";
import { nextTrack, pause, resume, stop } from "../player/playerSlice";
import {
  restartOrNextTrack,
  restartOrPreviousTrack
} from "../player/playerTime";
import { showAlert } from "./pluginsAlerts";
import { addArtists, removeArtists } from "../artists/artistsSlice";
import { addAlbums, removeAlbums } from "../albums/albumsSlice";
import {
  AlbumMetadata,
  Album,
  AlbumUri,
  ArtistMetadata,
  Artist,
  ArtistUri,
  Track,
  TrackId,
  TrackMetadata,
  TrackUri,
  BaseCallbacks,
  IntegrationCallbacks,
  PluginId,
  SourceCallbacks,
  SyncProgress
} from "../../../../types";

function validateTrackMetadata(track: TrackMetadata): void {
  const artists = getAsArray(track.artist);
  const artistUris = getAsArray(track.artistUri);
  const albumArtists = getAsArray(track.albumArtist);
  const albumArtistUris = getAsArray(track.albumArtistUri);
  // TODO: Consider allowing artist/albumArtist to be empty when URIs are provided so tracks do not always need to fetch artist names
  if (artistUris.length > 0 && artists.length !== artistUris.length) {
    throw new Error(
      `Track "${track.title}" (${track.uri}) has ${artists.length} artists but ${artistUris.length} artistUri(s). The number of artists must match the number of artistUris.`
    );
  }
  if (
    albumArtistUris.length > 0 &&
    albumArtists.length !== albumArtistUris.length
  ) {
    throw new Error(
      `Track "${track.title}" (${track.uri}) has ${albumArtists.length} albumArtist(s) but ${albumArtistUris.length} albumArtistUri(s). The number of albumArtists must match the number of albumArtistUris.`
    );
  }
}

function isPluginActive(pluginId: PluginId): boolean {
  const activePlugins = selectActivePlugins(store.getState());
  return activePlugins.includes(pluginId);
}

function handleUpdateData(pluginId: PluginId, data: object) {
  store.dispatch(setPluginData({ plugin: pluginId, data }));
}

function handleAddLibraryTracks(source: PluginId, metadata: TrackMetadata[]) {
  if (!isPluginActive(source)) return;
  metadata.forEach(validateTrackMetadata);
  const libraryTrackIds = selectAllTracks(store.getState()).map(
    (track) => track.trackId
  );
  const newTracks = metadata.filter(
    (track: TrackMetadata) =>
      !libraryTrackIds.includes(getTrackId(source, track.uri))
  );

  store.dispatch(addTracks({ source, tracks: newTracks, addToLibrary: true }));
}

function handleUpdateLibraryTracks(
  source: PluginId,
  metadata: TrackMetadata[]
) {
  if (!isPluginActive(source)) return;
  metadata.forEach(validateTrackMetadata);
  const newTracks = metadata.map((track: TrackMetadata) => ({
    ...track,
    trackId: getTrackId(source, track.uri),
    source: source
  }));

  store.dispatch(addTracks({ source, tracks: newTracks, addToLibrary: true }));
}

function handleRemoveLibraryTracks(source: PluginId, uris?: TrackUri[]) {
  if (uris) {
    const delTracks: TrackId[] = [];
    uris.forEach((uri: TrackUri) => {
      delTracks.push(getTrackId(source, uri));
    });
    store.dispatch(
      removeTracks({ source, tracks: delTracks, removeFromLibrary: true })
    );
  } else {
    store.dispatch(removeTracks({ source, removeFromLibrary: true }));
  }
}

function handleUpdateArtists(source: PluginId, metadata: ArtistMetadata[]) {
  if (!isPluginActive(source)) return;
  const artists: Artist[] = metadata.map((artist) => ({
    ...artist,
    source,
    artistId: getArtistId(source, artist.name, artist.uri)
  }));
  store.dispatch(addArtists({ source, artists }));
}

function handleRemoveArtists(source: PluginId, artists?: ArtistUri[]) {
  if (!isPluginActive(source)) return;
  store.dispatch(removeArtists({ source, artists }));
}

function handleUpdateAlbums(source: PluginId, metadata: AlbumMetadata[]) {
  if (!isPluginActive(source)) return;
  const albums: Album[] = metadata.map((album) => ({
    ...album,
    source,
    albumId: getAlbumId(source, album.name, album.artist, album.uri)
  }));
  store.dispatch(addAlbums({ source, albums }));
}

function handleRemoveAlbums(source: PluginId, uris?: AlbumUri[]) {
  if (!isPluginActive(source)) return;
  const albumIds = uris?.map((uri) => getAlbumId(source, "", undefined, uri));
  store.dispatch(removeAlbums({ source, albums: albumIds }));
}

export const getBaseCallbacks = (pluginId: PluginId): BaseCallbacks => {
  return {
    updateData: (data: object) => handleUpdateData(pluginId, data),
    getData: () => store.getState().plugins.pluginData[pluginId] ?? {},
    showAlert: (alert) => {
      showAlert(alert);
    }
  };
};

export const getIntegrationCallbacks = (
  pluginId: PluginId
): IntegrationCallbacks => {
  return {
    ...getBaseCallbacks(pluginId),
    pause: () => store.dispatch(pause()),
    resume: () => store.dispatch(resume()),
    stop: () => store.dispatch(stop()),
    next: () => store.dispatch(nextTrack()),
    previous: () => restartOrPreviousTrack()
  };
};

export const getSourceCallbacks = (pluginId: PluginId): SourceCallbacks => {
  return {
    ...getBaseCallbacks(pluginId),
    addLibraryTracks: (metadata: TrackMetadata[]) =>
      handleAddLibraryTracks(pluginId, metadata),
    removeLibraryTracks: (uris?: TrackUri[]) =>
      handleRemoveLibraryTracks(pluginId, uris),
    updateLibraryTracks: (metadata: TrackMetadata[]) =>
      handleUpdateLibraryTracks(pluginId, metadata),
    updateArtists: (metadata: ArtistMetadata[]) =>
      handleUpdateArtists(pluginId, metadata),
    removeArtists: (artists?: ArtistUri[]) =>
      handleRemoveArtists(pluginId, artists),
    updateAlbums: (metadata: AlbumMetadata[]) =>
      handleUpdateAlbums(pluginId, metadata),
    removeAlbums: (uris?: AlbumUri[]) => handleRemoveAlbums(pluginId, uris),
    setSyncProgress(syncProgress: SyncProgress) {
      store.dispatch(setSourceSyncProgress({ pluginId, syncProgress }));
    },
    finishPlayback() {
      restartOrNextTrack();
    },
    getTracks: () => {
      const libraryTracks = selectAllTracks(store.getState());
      return libraryTracks.filter((track: Track) => track.source === pluginId);
    },
    getArtists: () => {
      const allArtists = store.getState().artists.artists;
      return Object.values(allArtists).filter(
        (artist) => artist.source === pluginId
      );
    },
    getAlbums: () => {
      const allAlbums = store.getState().albums.albums;
      return Object.values(allAlbums.entities).filter(
        (album) => album?.source === pluginId
      );
    },
    getTrackByUri: (uri: TrackUri) => {
      return selectTrackById(store.getState(), getTrackId(pluginId, uri));
    },
    getVolume: () => store.getState().player.volume,
    getMuted: () => store.getState().player.muted
  };
};
