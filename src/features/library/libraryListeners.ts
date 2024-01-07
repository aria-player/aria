import { isAnyOf } from "@reduxjs/toolkit";
import { listenForAction } from "../../app/listener";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { addTracks, removeTracks, selectAllTracks } from "./librarySlice";
import { Track } from "./libraryTypes";

export function setupLibraryListeners() {
  listenForAction(isAnyOf(addTracks, removeTracks), (state, action) => {
    const libraryTracks = selectAllTracks(state);
    const tracks = libraryTracks.filter(
      (track: Track) => track.source === action.payload.source
    );
    const plugin = pluginHandles[action.payload.source] as SourceHandle;
    plugin?.onTracksUpdate?.(tracks);
  });
}
