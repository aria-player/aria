import { isAnyOf } from "@reduxjs/toolkit";
import { listenForAction } from "../../app/listener";
import { pluginHandles } from "../plugins/pluginsSlice";
import { PluginId, SourceHandle } from "../plugins/pluginsTypes";
import { addTracks, removeTracks, selectAllTracks } from "./tracksSlice";
import { Track, TrackId } from "./tracksTypes";

export function setupTracksListeners() {
  listenForAction(isAnyOf(addTracks, removeTracks), (state, action) => {
    const payload = action.payload as { source: PluginId; tracks?: TrackId[] };
    const tracksTracks = selectAllTracks(state);
    const tracks = tracksTracks.filter(
      (track: Track) => track.source === payload.source
    );
    const plugin = pluginHandles[payload.source] as SourceHandle;
    plugin?.onTracksUpdate?.(tracks);
  });
}
