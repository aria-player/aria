import { isAnyOf } from "@reduxjs/toolkit";
import { listenForAction } from "../../app/listener";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { addTracks, removeTracks, selectAllTracks } from "./tracksSlice";
import { Track } from "./tracksTypes";

export function setupTracksListeners() {
  listenForAction(isAnyOf(addTracks, removeTracks), (state, action) => {
    const tracksTracks = selectAllTracks(state);
    const tracks = tracksTracks.filter(
      (track: Track) => track.source === action.payload.source
    );
    const plugin = pluginHandles[action.payload.source] as SourceHandle;
    plugin?.onTracksUpdate?.(tracks);
  });
}
