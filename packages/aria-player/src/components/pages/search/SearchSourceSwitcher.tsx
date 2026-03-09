import { useTranslation } from "react-i18next";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  pluginHandles,
  getSourceHandle,
  selectActivePlugins,
  selectPluginInfo,
} from "../../../features/plugins/pluginsSlice";
import {
  selectSelectedSearchSource,
  selectSearch,
  setSelectedSearchSource,
} from "../../../features/search/searchSlice";
import {
  selectVisibleSearchCategory,
  selectVisibleSearchSource,
} from "../../../features/visibleSelectors";
import { sortPlugins } from "../../../app/utils";
import { PluginId } from "../../../../../types/plugins";
import styles from "./SearchSourceSwitcher.module.css";
import { push, replace } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useEffect } from "react";
import { selectLibraryTracks } from "../../../features/tracks/tracksSlice";

interface SearchSourceSwitcherProps {
  shouldNavigate?: boolean;
}

export default function SearchSourceSwitcher({
  shouldNavigate,
}: SearchSourceSwitcherProps = {}) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const activePlugins = useAppSelector(selectActivePlugins);
  const plugins = useAppSelector(selectPluginInfo);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const selectedSearchSource = useAppSelector(selectSelectedSearchSource);
  const search = useAppSelector(selectSearch);
  const libraryTracks = useAppSelector(selectLibraryTracks);

  const hasExternalSearch = (plugin: PluginId) => {
    // TODO: Possibly include plugins that don't support all search functions
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

  useEffect(() => {
    if (
      visibleSearchSource !== null &&
      !searchableSourcePlugins.includes(visibleSearchSource)
    ) {
      dispatch(
        replace(
          BASEPATH +
            `search/${encodeURIComponent(search)}/library/${encodeURIComponent(visibleSearchCategory ?? "")}`
        )
      );
      dispatch(setSelectedSearchSource("library"));
    } else if (
      visibleSearchSource !== null &&
      visibleSearchSource !== selectedSearchSource
    ) {
      dispatch(setSelectedSearchSource(visibleSearchSource));
    }
  }, [
    visibleSearchSource,
    selectedSearchSource,
    searchableSourcePlugins,
    dispatch,
    search,
    visibleSearchCategory,
  ]);

  if (
    searchableSourcePlugins.length === 0 ||
    (externalSearchPlugins.length === 0 && librarySources <= 1)
  ) {
    return null;
  }

  const getDisplayName = (pluginId: PluginId) => {
    return (
      pluginHandles[pluginId]?.displayName ??
      plugins[pluginId]?.name ??
      pluginId
    );
  };

  const activeSource = shouldNavigate
    ? visibleSearchSource
    : selectedSearchSource;

  const switchToSource = (source: string) => {
    if (!shouldNavigate) {
      dispatch(setSelectedSearchSource(source === "library" ? null : source));
      return;
    }
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
        className={`${styles.option} ${activeSource === null ? styles.selected : ""}`}
        onClick={() => switchToSource("library")}
      >
        {t("search.sources.library")}
      </button>
      {searchableSourcePlugins.map((pluginId) => (
        <button
          key={pluginId}
          className={`${styles.option} ${activeSource === pluginId ? styles.selected : ""}`}
          onClick={() => switchToSource(pluginId)}
        >
          {getDisplayName(pluginId)}
        </button>
      ))}
    </div>
  );
}
