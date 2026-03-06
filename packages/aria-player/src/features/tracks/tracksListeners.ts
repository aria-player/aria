import { isAnyOf } from "@reduxjs/toolkit";
import { listenForAction, listenForChange } from "../../app/listener";
import { getSourceHandle } from "../plugins/pluginsSlice";
import { PluginId } from "../../../../types/plugins";
import { addTracks, removeTracks, selectAllTracks } from "./tracksSlice";
import { getUnreferencedTrackIds } from "./tracksUtils.ts";
import { Track, TrackId } from "../../../../types/tracks";
import { compareMetadata } from "../../app/sort";
import { removeCachedTracks } from "../cache/cacheSlice";
import { clearCurrentTrack } from "../player/playerSlice";
import { parseTrackId } from "../../app/utils.ts";

export function setupTracksListeners() {
  listenForAction(isAnyOf(addTracks, removeTracks), (state, action) => {
    const payload = action.payload as { source: PluginId; tracks?: TrackId[] };
    const tracksTracks = selectAllTracks(state);
    const tracks = tracksTracks.filter(
      (track: Track) => track.source === payload.source
    );
    const plugin = getSourceHandle(payload.source);
    plugin?.onTracksUpdate?.(tracks);
  });

  listenForAction(isAnyOf(removeTracks), (state, action, dispatch) => {
    const payload = action.payload as {
      source: PluginId;
      tracks?: TrackId[];
      removeFromLibrary?: boolean;
    };
    if (payload.removeFromLibrary) {
      return;
    }
    dispatch(
      removeCachedTracks({
        source: payload.source,
        tracks: payload.tracks
      })
    );
    const currentTrackId = state.player.currentTrack?.trackId;
    if (
      currentTrackId != null &&
      (payload.tracks?.includes(currentTrackId) ||
        (payload.tracks == null &&
          parseTrackId(currentTrackId)?.source === payload.source))
    ) {
      dispatch(clearCurrentTrack());
    }
  });

  listenForChange(
    (state) => state.tracks._persist?.rehydrated,
    (state, _action, dispatch) => {
      if (state.tracks._persist?.rehydrated) {
        [...selectAllTracks(state)].sort((trackA, trackB) =>
          compareMetadata(trackA.title, trackB.title)
        );
        const unreferencedTrackIds = getUnreferencedTrackIds(state);
        const tracksBySource = new Map<PluginId, TrackId[]>();
        unreferencedTrackIds.forEach((trackId: TrackId) => {
          const track = state.tracks.tracks?.entities[trackId];
          if (track?.source) {
            const tracks = tracksBySource.get(track.source) ?? [];
            tracks.push(trackId);
            tracksBySource.set(track.source, tracks);
          }
        });
        tracksBySource.forEach((tracks, source) => {
          dispatch(removeTracks({ source, tracks }));
        });
      }
    }
  );
}
