import { isAnyOf } from "@reduxjs/toolkit";
import { startListening } from "../../app/listener";
import { store } from "../../app/store";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { addTracks, removeTracks, selectAllTracks } from "./librarySlice";
import { Track } from "./libraryTypes";

export function setupLibraryListeners() {
  startListening({
    matcher: isAnyOf(addTracks, removeTracks),
    effect: (action) => {
      const libraryTracks = selectAllTracks(store.getState());
      const tracks = libraryTracks.filter(
        (track: Track) => track.source === action.payload.source
      );
      const plugin = pluginHandles[action.payload.source] as SourceHandle;
      plugin?.onTracksUpdate?.(tracks);
    }
  });
}
