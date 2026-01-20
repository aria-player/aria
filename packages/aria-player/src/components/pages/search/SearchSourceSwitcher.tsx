import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  pluginHandles,
  getSourceHandle,
  selectActivePlugins,
  selectPluginInfo
} from "../../../features/plugins/pluginsSlice";
import {
  selectSelectedSearchSource,
  selectSearch,
  setSelectedSearchSource
} from "../../../features/search/searchSlice";
import {
  selectVisibleSearchCategory,
  selectVisibleSearchSource
} from "../../../features/visibleSelectors";
import { sortPlugins } from "../../../app/utils";
import { PluginId } from "../../../../../types/plugins";
import styles from "./SearchSourceSwitcher.module.css";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useEffect } from "react";
import { selectLibraryTracks } from "../../../features/tracks/tracksSlice";

export default function SearchSourceSwitcher() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activePlugins = useAppSelector(selectActivePlugins);
  const plugins = useAppSelector(selectPluginInfo);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const selectedSearchSource = useAppSelector(selectSelectedSearchSource);
  const search = useAppSelector(selectSearch);
  const libraryTracks = useAppSelector(selectLibraryTracks);

  useEffect(() => {
    if (visibleSearchSource !== selectedSearchSource) {
      dispatch(setSelectedSearchSource(visibleSearchSource));
    }
  }, [dispatch, visibleSearchSource, selectedSearchSource]);

  const searchableSourcePlugins = activePlugins
    .filter((plugin: PluginId) => {
      if (!plugins[plugin].capabilities?.includes("source")) {
        return false;
      }
      const handle = getSourceHandle(plugin);
      // TODO: Possibly include plugins that don't support all search functions
      const searchAvailable =
        !!handle?.searchTracks &&
        !!handle?.searchAlbums &&
        !!handle?.searchArtists;
      const hasLibraryTracks = libraryTracks.some(
        (track) => track.source === plugin
      );
      return searchAvailable || hasLibraryTracks;
    })
    .sort(sortPlugins);

  if (searchableSourcePlugins.length === 0) {
    return null;
  }

  const getDisplayName = (pluginId: PluginId) => {
    return (
      pluginHandles[pluginId]?.displayName ??
      plugins[pluginId]?.name ??
      pluginId
    );
  };

  const switchToSource = (source: string) => {
    dispatch(
      push(
        BASEPATH +
          `search/${encodeURIComponent(search)}/${encodeURIComponent(source)}/${encodeURIComponent(visibleSearchCategory ?? "")}`
      )
    );
    dispatch(setSelectedSearchSource(source));
  };

  return (
    <div className={styles.switcher}>
      <button
        className={`${styles.option} ${visibleSearchSource === null ? styles.selected : ""}`}
        onClick={() => switchToSource("library")}
      >
        {t("search.sources.library")}
      </button>
      {searchableSourcePlugins.map((pluginId) => (
        <button
          key={pluginId}
          className={`${styles.option} ${visibleSearchSource === pluginId ? styles.selected : ""}`}
          onClick={() => switchToSource(pluginId)}
        >
          {getDisplayName(pluginId)}
        </button>
      ))}
    </div>
  );
}
