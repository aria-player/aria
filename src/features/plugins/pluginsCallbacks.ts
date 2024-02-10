import { store } from "../../app/store";
import { getTrackId } from "../../app/utils";
import { Track, TrackId, TrackMetadata, TrackUri } from "../tracks/tracksTypes";
import {
  addTracks,
  removeTracks,
  selectAllTracks,
  selectTrackById,
  selectTrackIds
} from "../tracks/tracksSlice";
import { selectActivePlugins, setPluginData } from "./pluginsSlice";
import { PluginId, BaseCallbacks, SourceCallbacks } from "./pluginsTypes";

function isPluginActive(pluginId: PluginId): boolean {
  const activePlugins = selectActivePlugins(store.getState());
  return activePlugins.includes(pluginId);
}

function handleUpdateData(pluginId: PluginId, data: object) {
  store.dispatch(setPluginData({ plugin: pluginId, data }));
}

function handleAddTracks(source: PluginId, metadata: TrackMetadata[]) {
  if (!isPluginActive(source)) return;
  const libraryTrackIds = selectTrackIds(store.getState());
  const newTracks = metadata
    .filter(
      (track: TrackMetadata) =>
        !libraryTrackIds.includes(getTrackId(source, track.uri))
    )
    .map((track: TrackMetadata) => ({
      ...track,
      trackId: getTrackId(source, track.uri),
      source: source
    }));

  store.dispatch(addTracks({ source, tracks: newTracks }));
}

function handleUpdateMetadata(source: PluginId, metadata: TrackMetadata[]) {
  if (!isPluginActive(source)) return;
  const libraryTrackIds = selectTrackIds(store.getState());
  const newTracks = metadata
    .filter((track: TrackMetadata) =>
      libraryTrackIds.includes(getTrackId(source, track.uri))
    )
    .map((track: TrackMetadata) => ({
      ...track,
      trackId: getTrackId(source, track.uri),
      source: source
    }));

  store.dispatch(addTracks({ source, tracks: newTracks }));
}

function handleRemoveTracks(source: PluginId, uris?: TrackUri[]) {
  if (uris) {
    const delTracks: TrackId[] = [];
    uris.forEach((uri: TrackUri) => {
      delTracks.push(getTrackId(source, uri));
    });
    store.dispatch(removeTracks({ source, tracks: delTracks }));
  } else {
    store.dispatch(removeTracks({ source }));
  }
}

export const getBaseCallbacks = (pluginId: PluginId): BaseCallbacks => {
  return {
    updateData: (data: object) => handleUpdateData(pluginId, data),
    getData: () => store.getState().plugins.pluginData[pluginId] ?? {}
  };
};

export const getSourceCallbacks = (pluginId: PluginId): SourceCallbacks => {
  return {
    ...getBaseCallbacks(pluginId),
    addTracks: (metadata: TrackMetadata[]) =>
      handleAddTracks(pluginId, metadata),
    removeTracks: (uris?: TrackUri[]) => handleRemoveTracks(pluginId, uris),
    updateMetadata: (metadata: TrackMetadata[]) =>
      handleUpdateMetadata(pluginId, metadata),
    getTracks: () => {
      const libraryTracks = selectAllTracks(store.getState());
      return libraryTracks.filter((track: Track) => track.source === pluginId);
    },
    getTrackByUri: (uri: TrackUri) => {
      return selectTrackById(store.getState(), getTrackId(pluginId, uri));
    },
    getVolume: () => store.getState().player.volume,
    getMuted: () => store.getState().player.muted
  };
};
