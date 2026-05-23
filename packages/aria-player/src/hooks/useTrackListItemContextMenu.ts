import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useContextMenu } from "soprano-ui";
import { useTranslation } from "react-i18next";
import { store } from "../app/store";
import {
  selectSelectedTracks,
  selectTrackById,
} from "../features/tracks/tracksSlice";
import {
  removeFromQueue,
  setQueueToNewSource,
  skipQueueIndexes,
} from "../features/player/playerSlice";
import {
  removePlaylistTracksThunk,
  selectPlaylistById,
} from "../features/playlists/playlistsSlice";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisibleDisplayMode,
  selectVisibleGroupFilteredTrackList,
  selectVisibleTrackGrouping,
  selectVisibleSelectedTrackGroup,
  selectVisibleSearchTracks,
  selectVisibleArtistTracks,
} from "../features/visibleSelectors";
import {
  addToSearchHistory,
  selectSearch,
} from "../features/search/searchSlice";
import { pluginHandles } from "../features/plugins/pluginsSlice";
import { selectSortedTrackList } from "../features/genericSelectors";
import { getRelativePath } from "../app/utils";
import { DisplayMode, LibraryView, View } from "../app/view";
import { Track } from "../../../types/tracks";
import { useTrackMenuItems } from "./useTrackMenuItems";

export function useTrackListItemContextMenu(locationPathname: string) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const selectedTracks = useAppSelector(selectSelectedTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const buildTrackMenuItems = useTrackMenuItems();
  const showContextMenu = useContextMenu();

  const canRemoveFromPlaylist =
    !!visiblePlaylist &&
    (!visiblePlaylist.provider ||
      ((visiblePlaylist.permissions === "write" ||
        visiblePlaylist.permissions === "manage") &&
        !!pluginHandles[visiblePlaylist.provider]?.removePlaylistTracks));

  return useCallback(
    (
      event: MouseEvent,
      rowIndex: number | null,
      nodeData: Track,
      nodeIsSelected: boolean,
      setNodeSelected: (selected: boolean, clearSelection: boolean) => void
    ) => {
      if (!nodeIsSelected) {
        setNodeSelected(true, true);
      }

      const clickedTrack: Track = nodeData;
      const tracksForActions = selectedTracks.length
        ? selectedTracks
            .map((item) => selectTrackById(store.getState(), item.trackId)!)
            .filter(Boolean)
        : [clickedTrack];

      const isQueueView = visibleViewType === View.Queue;

      const items = [
        {
          label: t("tracks.selectedCount", {
            count: selectedTracks.length || 1,
          }),
          disabled: true,
        },
        { type: "separator" as const },
        {
          label: t("tracks.playNamedTrack", { title: clickedTrack?.title }),
          onSelect: () => {
            if (isQueueView) {
              dispatch(skipQueueIndexes(rowIndex ?? 0));
              return;
            }
            const state = store.getState();
            const itemSource = getRelativePath(locationPathname);
            const playlistId = selectPlaylistById(
              state,
              itemSource?.split("/")[1] ?? ""
            )?.id;
            if (visibleViewType === View.Search) {
              dispatch(addToSearchHistory(selectSearch(state)));
            }
            const searchResults = selectVisibleSearchTracks(state);
            const visibleArtistTracks = selectVisibleArtistTracks(state);
            const visibleDisplayMode = selectVisibleDisplayMode(state);
            dispatch(
              setQueueToNewSource({
                queue:
                  visibleViewType === View.Search
                    ? (searchResults ?? [])
                    : visibleViewType === View.Artist
                      ? visibleArtistTracks
                      : visibleDisplayMode === DisplayMode.TrackList
                        ? selectSortedTrackList(
                            state,
                            visibleViewType,
                            playlistId
                          )
                        : selectVisibleGroupFilteredTrackList(state),
                queueSource: itemSource ?? LibraryView.Songs,
                queueIndex: rowIndex ?? 0,
                queueGrouping: selectVisibleTrackGrouping(state) ?? null,
                queueSelectedGroup:
                  selectVisibleSelectedTrackGroup(state) ?? null,
              })
            );
          },
        },
        { type: "separator" as const },
        ...buildTrackMenuItems(tracksForActions, clickedTrack),
      ];

      if (canRemoveFromPlaylist || (isQueueView && rowIndex !== 0)) {
        items.push({ type: "separator" as const });
      }

      if (canRemoveFromPlaylist) {
        items.push({
          label: t("tracks.removeFromPlaylist"),
          onSelect: () =>
            dispatch(
              removePlaylistTracksThunk(visiblePlaylist!.id, selectedTracks)
            ),
        });
      }

      if (isQueueView && rowIndex !== 0) {
        items.push({
          label: t("tracks.removeFromQueue"),
          onSelect: () =>
            dispatch(
              removeFromQueue(selectedTracks.map((track) => track.itemId))
            ),
        });
      }

      showContextMenu(event, items);
    },
    [
      selectedTracks,
      visibleViewType,
      t,
      buildTrackMenuItems,
      canRemoveFromPlaylist,
      showContextMenu,
      locationPathname,
      dispatch,
      visiblePlaylist,
    ]
  );
}
