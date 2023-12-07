import { store } from "../../app/store";
import {
  selectTrackIds,
  addTracks,
  removeTracks
} from "../library/librarySlice";
import { TrackId, TrackMetadata, TrackUri } from "../library/libraryTypes";
import { setPluginConfig } from "./pluginsSlice";
import { PluginId, BaseCallbacks, SourceCallbacks } from "./pluginsTypes";

function handleUpdateConfig(pluginId: PluginId, config: unknown) {
  store.dispatch(setPluginConfig({ plugin: pluginId, config }));
}

function handleAddTracks(source: PluginId, metadata: TrackMetadata[]) {
  const libraryTrackIds = selectTrackIds(store.getState());
  const newTracks = metadata
    .filter(
      (track: TrackMetadata) =>
        !libraryTrackIds.includes(source + ":" + track.uri)
    )
    .map((track: TrackMetadata) => ({
      ...track,
      id: source + ":" + track.uri,
      source: source
    }));

  store.dispatch(addTracks(newTracks));
}

function handleUpdateMetadata(source: PluginId, metadata: TrackMetadata[]) {
  const libraryTrackIds = selectTrackIds(store.getState());
  const newTracks = metadata
    .filter((track: TrackMetadata) =>
      libraryTrackIds.includes(source + ":" + track.uri)
    )
    .map((track: TrackMetadata) => ({
      ...track,
      id: source + ":" + track.uri,
      source: source
    }));

  store.dispatch(addTracks(newTracks));
}

function handleRemoveTracks(source: PluginId, uris?: TrackUri[]) {
  if (uris) {
    const delTracks: TrackId[] = [];
    uris.forEach((uri: TrackUri) => {
      delTracks.push(source + ":" + uri);
    });
    store.dispatch(removeTracks({ source, tracks: delTracks }));
  } else {
    store.dispatch(removeTracks({ source }));
  }
}

export const getBaseCallbacks = (pluginId: PluginId): BaseCallbacks => {
  return {
    updateConfig: (config: unknown) => handleUpdateConfig(pluginId, config)
  };
};

export const getSourceCallbacks = (pluginId: PluginId): SourceCallbacks => {
  return {
    ...getBaseCallbacks(pluginId),
    addTracks: (metadata: TrackMetadata[]) =>
      handleAddTracks(pluginId, metadata),
    removeTracks: (uris?: TrackUri[]) => handleRemoveTracks(pluginId, uris),
    updateMetadata: (metadata: TrackMetadata[]) =>
      handleUpdateMetadata(pluginId, metadata)
  };
};