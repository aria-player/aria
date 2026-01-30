import { RootState, store } from "../../app/store";
import { TrackId } from "../../../../types/tracks";
import { selectAllTracks, addTracks } from "./tracksSlice";
import { selectAllPlaylists } from "../playlists/playlistsSlice";
import { parseTrackId } from "../../app/utils";
import { getSourceHandle } from "../plugins/pluginsSlice";

const pendingTrackFetches = new Set<TrackId>();

export function fetchMissingTrack(trackId: TrackId): void {
  if (pendingTrackFetches.has(trackId)) {
    return;
  }
  const track = parseTrackId(trackId);
  const pluginHandle = track ? getSourceHandle(track.source) : null;
  if (!track || !pluginHandle?.getTrack) {
    return;
  }
  pendingTrackFetches.add(trackId);
  pluginHandle
    .getTrack(track.uri)
    .then((trackMetadata) => {
      if (trackMetadata) {
        store.dispatch(
          addTracks({
            source: track.source,
            tracks: [trackMetadata],
            addToLibrary: false
          })
        );
      }
    })
    .catch((error) => {
      console.error(`Failed to fetch track ${trackId}:`, error);
    })
    .finally(() => {
      pendingTrackFetches.delete(trackId);
    });
}

export function getReferencedTrackIds(state: RootState): Set<TrackId> {
  const referenced = new Set<TrackId>();
  // Library tracks
  const allTracks = selectAllTracks(state);
  allTracks.forEach((track) => {
    if (track?.isInLibrary) {
      referenced.add(track.trackId);
    }
  });

  // Playlist tracks
  const currentPlaylists = selectAllPlaylists(state);
  currentPlaylists.forEach((playlist) => {
    playlist?.tracks.forEach((item) => {
      referenced.add(item.trackId);
    });
  });

  // Queue tracks
  state.player.queue.forEach((item) => {
    referenced.add(item.trackId);
  });

  // Up next tracks
  state.player.upNext.forEach((item) => {
    referenced.add(item.trackId);
  });

  // Artist top tracks cache
  Object.values(state.cache.artistTopTracks).forEach((trackIds) => {
    trackIds.forEach((trackId) => {
      referenced.add(trackId);
    });
  });

  return referenced;
}

export function getUnreferencedTrackIds(state: RootState): TrackId[] {
  const referenced = getReferencedTrackIds(state);
  const unreferenced: TrackId[] = [];
  const allTracks = selectAllTracks(state);
  allTracks.forEach((track) => {
    if (track && !referenced.has(track.trackId)) {
      unreferenced.push(track.trackId);
    }
  });

  return unreferenced;
}
