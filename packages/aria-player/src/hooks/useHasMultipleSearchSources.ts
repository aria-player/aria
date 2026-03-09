import { useAppSelector } from "../app/hooks";
import {
  getSourceHandle,
  selectActivePlugins,
  selectPluginInfo,
} from "../features/plugins/pluginsSlice";
import { selectLibraryTracks } from "../features/tracks/tracksSlice";
import { PluginId } from "../../../types/plugins";
import { sortPlugins } from "../app/utils";

export function useHasMultipleSearchSources(): boolean {
  const activePlugins = useAppSelector(selectActivePlugins);
  const plugins = useAppSelector(selectPluginInfo);
  const libraryTracks = useAppSelector(selectLibraryTracks);

  const hasExternalSearch = (plugin: PluginId) => {
    const handle = getSourceHandle(plugin);
    return (
      !!handle?.searchTracks &&
      !!handle?.searchAlbums &&
      !!handle?.searchArtists
    );
  };

  const searchableSourcePlugins = activePlugins
    .filter((plugin: PluginId) => {
      if (!plugins[plugin].capabilities?.includes("source")) {
        return false;
      }
      const hasLibraryTracks = libraryTracks.some(
        (track) => track.source === plugin
      );
      return hasExternalSearch(plugin) || hasLibraryTracks;
    })
    .sort(sortPlugins);

  const externalSearchPlugins =
    searchableSourcePlugins.filter(hasExternalSearch);
  const librarySources = new Set(libraryTracks.map((track) => track.source))
    .size;

  return (
    searchableSourcePlugins.length > 0 &&
    (externalSearchPlugins.length > 0 || librarySources > 1)
  );
}
