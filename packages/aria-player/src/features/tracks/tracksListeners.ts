import { isAnyOf } from "@reduxjs/toolkit";
import { listenForAction, listenForChange } from "../../app/listener";
import { getSourceHandle } from "../plugins/pluginsSlice";
import { PluginId } from "../../../../types/plugins";
import { addTracks, removeTracks, selectAllTracks } from "./tracksSlice";
import { Track, TrackId } from "../../../../types/tracks";
import { compareMetadata } from "../../app/sort";
import { invalidateSearchCache } from "../../app/search";

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
    (state) => {
      if (state.tracks._persist?.rehydrated) {
        [...selectAllTracks(state)].sort((trackA, trackB) =>
          compareMetadata(trackA.title, trackB.title)
        );
      }
    }
  );

  listenForChange(
    (state) => state.tracks.tracks,
    () => {
      invalidateSearchCache();
    }
  );
}
