import { startListening } from "../../app/listener";
import { store } from "../../app/store";
import { plugins } from "../../plugins/plugins";
import { pluginHandles } from "../plugins/pluginsSlice";
import { SourceHandle } from "../plugins/pluginsTypes";
import { selectAllTracks } from "./librarySlice";
import { Track } from "./libraryTypes";

export function setupLibraryListeners() {
  startListening({
    predicate: (_action, currentState, previousState) => {
      return currentState.library.tracks !== previousState.library.tracks;
    },
    effect: (_action, api) => {
      // TODO: Use the action payload to only call onTracksUpdate on the source it affects
      const activePlugins = api.getState().plugins.pluginsActive;
      activePlugins.forEach((plugin) => {
        const libraryTracks = selectAllTracks(store.getState());
        const tracks = libraryTracks.filter(
          (track: Track) => track.source === plugin
        );
        if (plugins[plugin].type === "source") {
          (pluginHandles[plugin] as SourceHandle)?.onTracksUpdate?.(tracks);
        }
      });
    }
  });
}
