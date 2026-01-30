import { RootState } from "../../app/store";
import { TrackId } from "../../../../types/tracks";
import { selectAllTracks } from "./tracksSlice";
import { selectAllPlaylists } from "../playlists/playlistsSlice";

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
