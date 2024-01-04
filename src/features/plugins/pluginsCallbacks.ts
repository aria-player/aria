import { store } from "../../app/store";
import { getTrackId } from "../../app/utils";
import {
  selectTrackIds,
  addTracks,
  removeTracks,
  selectAllTracks,
  selectTrackById
} from "../library/librarySlice";
import {
  Track,
  TrackId,
  TrackMetadata,
  TrackUri
} from "../library/libraryTypes";
import { setPluginConfig } from "./pluginsSlice";
import { PluginId, BaseCallbacks, SourceCallbacks } from "./pluginsTypes";

function handleUpdateConfig(pluginId: PluginId, config: object) {
  store.dispatch(setPluginConfig({ plugin: pluginId, config }));
}

function handleAddTracks(source: PluginId, metadata: TrackMetadata[]) {
  const libraryTrackIds = selectTrackIds(store.getState());
  const newTracks = metadata
    .filter(
      (track: TrackMetadata) =>
        !libraryTrackIds.includes(getTrackId(source, track.uri))
    )
    .map((track: TrackMetadata) => ({
      ...track,
      id: getTrackId(source, track.uri),
      source: source
    }));

  store.dispatch(addTracks({ source, tracks: newTracks }));
}

function handleUpdateMetadata(source: PluginId, metadata: TrackMetadata[]) {
  const libraryTrackIds = selectTrackIds(store.getState());
  const newTracks = metadata
    .filter((track: TrackMetadata) =>
      libraryTrackIds.includes(getTrackId(source, track.uri))
    )
    .map((track: TrackMetadata) => ({
      ...track,
      id: getTrackId(source, track.uri),
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
    updateConfig: (config: object) => handleUpdateConfig(pluginId, config),
    getConfig: () => store.getState().plugins.pluginsConfig[pluginId] ?? {}
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
    }
  };
};
