import { Item, Menu, Separator } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { useContext } from "react";
import { t } from "i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  removePlaylistTracksThunk,
  selectPlaylistById,
} from "../../features/playlists/playlistsSlice";
import { selectSelectedTracks } from "../../features/tracks/tracksSlice";
import { pluginHandles } from "../../features/plugins/pluginsSlice";
import { store } from "../../app/store";
import { DisplayMode, LibraryView, View } from "../../app/view";
import {
  removeFromQueue,
  setQueueToNewSource,
  skipQueueIndexes,
} from "../../features/player/playerSlice";
import { selectSortedTrackList } from "../../features/genericSelectors";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisibleDisplayMode,
  selectVisibleGroupFilteredTrackList,
  selectVisibleTrackGrouping,
  selectVisibleSelectedTrackGroup,
  selectVisibleSearchTracks,
  selectVisibleArtistTracks,
} from "../../features/visibleSelectors";
import {
  addToSearchHistory,
  selectSearch,
} from "../../features/search/searchSlice";
import { TrackMenuItems } from "./items/TrackMenuItems";

const id = "tracklistitem";

export function TrackListItemContextMenu() {
  const dispatch = useAppDispatch();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleView = useAppSelector(selectVisibleViewType);
  const selectedTracks = useAppSelector(selectSelectedTracks);
  const canRemoveFromPlaylist =
    !!visiblePlaylist &&
    (!visiblePlaylist.provider ||
      ((visiblePlaylist.permissions === "write" ||
        visiblePlaylist.permissions === "manage") &&
        !!pluginHandles[visiblePlaylist.provider]?.removePlaylistTracks));

  return (
    <Menu
      onContextMenu={(e) => {
        if (!e.shiftKey) {
          e.preventDefault();
          return false;
        }
      }}
      id={id}
      animation={false}
      onVisibilityChange={(isVisible) => updateVisibility(id, isVisible)}
    >
      <Item disabled>
        {t("tracks.selectedCount", {
          count: selectedTracks.length,
        })}
      </Item>
      <Separator />
      <Item
        onClick={() => {
          if (!menuData) return;
          if (menuData.itemSource == View.Queue) {
            dispatch(skipQueueIndexes(menuData.itemIndex));
          } else {
            const state = store.getState();
            const playlistId = selectPlaylistById(
              state,
              menuData.itemSource?.split("/")[1] ?? ""
            )?.id;
            if (visibleView == View.Search) {
              dispatch(addToSearchHistory(selectSearch(state)));
            }
            const searchResults = selectVisibleSearchTracks(state);
            const visibleArtistTracks = selectVisibleArtistTracks(state);
            dispatch(
              setQueueToNewSource({
                queue:
                  visibleView == View.Search
                    ? (searchResults ?? [])
                    : visibleView == View.Artist
                      ? visibleArtistTracks
                      : selectVisibleDisplayMode(state) == DisplayMode.TrackList
                        ? selectSortedTrackList(state, visibleView, playlistId)
                        : selectVisibleGroupFilteredTrackList(state),
                queueSource: menuData.itemSource ?? LibraryView.Songs,
                queueIndex: menuData.itemIndex ?? 0,
                queueGrouping: selectVisibleTrackGrouping(state) ?? null,
                queueSelectedGroup:
                  selectVisibleSelectedTrackGroup(state) ?? null,
              })
            );
          }
        }}
      >
        {t("tracks.playNamedTrack", {
          title: menuData?.metadata?.title,
        })}
      </Item>
      <Separator />
      <TrackMenuItems />
      {(canRemoveFromPlaylist ||
        (visibleView == View.Queue && menuData?.itemIndex != 0)) && (
        <Separator />
      )}
      {canRemoveFromPlaylist && (
        <Item
          onClick={() => {
            dispatch(
              removePlaylistTracksThunk(visiblePlaylist!.id, selectedTracks)
            );
          }}
        >
          {t("tracks.removeFromPlaylist")}
        </Item>
      )}
      {visibleView == View.Queue && menuData?.itemIndex != 0 && (
        <>
          <Item
            onClick={() => {
              dispatch(
                removeFromQueue(selectedTracks.map((track) => track.itemId))
              );
            }}
          >
            {t("tracks.removeFromQueue")}
          </Item>
        </>
      )}
    </Menu>
  );
}
