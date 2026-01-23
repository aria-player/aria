import { isAnyOf } from "@reduxjs/toolkit";
import { listenForAction, listenForChange } from "../../app/listener";
import { getSourceHandle } from "../plugins/pluginsSlice";
import { PluginId } from "../../../../types/plugins";
import { addTracks, removeTracks, selectAllTracks } from "./tracksSlice";
import { getUnreferencedTrackIds } from "./tracksUtils.ts";
import { Track, TrackId } from "../../../../types/tracks";
import { compareMetadata } from "../../app/sort";

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
