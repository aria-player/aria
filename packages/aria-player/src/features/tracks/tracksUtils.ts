import { RootState, store } from "../../app/store";
import { TrackId } from "../../../../types/tracks";
import { selectAllTracks, addTracks } from "./tracksSlice";
import { selectAllPlaylists } from "../playlists/playlistsSlice";
import { parseTrackId } from "../../app/utils";
import { getSourceHandle } from "../plugins/pluginsSlice";

const pendingTrackFetches = new Set<TrackId>();
const pendingBatchBySource = new Map<string, Set<string>>();

export function fetchMissingTrack(trackId: TrackId): void {
  if (pendingTrackFetches.has(trackId)) return;
  const track = parseTrackId(trackId);
  const handle = track ? getSourceHandle(track.source) : null;
  if (!track || (!handle?.getTracksByUri && !handle?.getTrack)) return;
  pendingTrackFetches.add(trackId);

  if (handle.getTracksByUri) {
    const { source, uri } = track;
    if (!pendingBatchBySource.has(source)) {
      pendingBatchBySource.set(source, new Set());
      setTimeout(() => {
        const uris = Array.from(pendingBatchBySource.get(source) ?? []);
        pendingBatchBySource.delete(source);
        const currentHandle = getSourceHandle(source);
        if (!currentHandle?.getTracksByUri || uris.length === 0) return;
        currentHandle
          .getTracksByUri(uris)
          .then((tracks) => {
            if (tracks?.length)
              store.dispatch(
                addTracks({ source, tracks, addToLibrary: false })
              );
          })
          .finally(() => {
            uris.forEach((u) =>
              pendingTrackFetches.delete(`${source}:uri:${u}`)
            );
          });
      }, 0);
    }
    pendingBatchBySource.get(source)!.add(uri);
  } else {
    handle.getTrack!(track.uri)
      .then((trackMetadata) => {
        if (trackMetadata)
          store.dispatch(
            addTracks({
              source: track.source,
              tracks: [trackMetadata],
              addToLibrary: false,
            })
          );
      })
      .catch((error) =>
        console.error(`Failed to fetch track ${trackId}:`, error)
      )
      .finally(() => pendingTrackFetches.delete(trackId));
  }
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
