import { Item, Menu, Separator } from "react-contexify";
import { MenuContext } from "../../contexts/MenuContext";
import { useContext } from "react";
import { t } from "i18next";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  removeTracksFromPlaylist,
  selectPlaylistById
} from "../../features/playlists/playlistsSlice";
import { selectSelectedTracks } from "../../features/tracks/tracksSlice";
import { store } from "../../app/store";
import { DisplayMode, LibraryView, View } from "../../app/view";
import {
  removeFromQueue,
  setQueueToNewSource,
  skipQueueIndexes
} from "../../features/player/playerSlice";
import { selectSortedTrackList } from "../../features/genericSelectors";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisibleDisplayMode,
  selectVisibleGroupFilteredTrackList,
  selectVisibleTrackGrouping,
  selectVisibleSelectedTrackGroup,
  selectVisibleTracks
} from "../../features/visibleSelectors";
import {
  addToSearchHistory,
  selectSearch
} from "../../features/search/searchSlice";
import { TrackMenuItems } from "./items/TrackMenuItems";

const id = "tracklistitem";

export function TrackListItemContextMenu() {
  const dispatch = useAppDispatch();
  const { updateVisibility, menuData } = useContext(MenuContext);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleView = useAppSelector(selectVisibleViewType);
  const selectedTracks = useAppSelector(selectSelectedTracks);

  return (
    <Menu
      onContextMenu={(e) => {
        e.preventDefault();
        return false;
      }}
      id={id}
      animation={false}
      onVisibilityChange={(isVisible) => updateVisibility(id, isVisible)}
    >
      <Item disabled>
        {t("tracks.selectedCount", {
          count: selectedTracks.length
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
            const source = selectPlaylistById(
              state,
              menuData.itemSource?.split("/")[1] ?? ""
            )?.id;
            if (visibleView == View.Search) {
              dispatch(addToSearchHistory(selectSearch(state)));
            }
            dispatch(
              setQueueToNewSource({
                queue:
                  selectVisibleDisplayMode(state) == DisplayMode.TrackList
                    ? visibleView == View.Search
                      ? selectVisibleTracks(state)
                      : selectSortedTrackList(state, source ?? undefined)
                    : selectVisibleGroupFilteredTrackList(state),
                queueSource: menuData.itemSource ?? LibraryView.Songs,
                queueIndex: menuData.itemIndex ?? 0,
                queueGrouping: selectVisibleTrackGrouping(state) ?? null,
                queueSelectedGroup:
                  selectVisibleSelectedTrackGroup(state) ?? null
              })
            );
          }
        }}
      >
        {t("tracks.playNamedTrack", {
          title: menuData?.metadata?.title
        })}
      </Item>
      <Separator />
      <TrackMenuItems />
      {(visiblePlaylist ||
        (visibleView == View.Queue && menuData?.itemIndex != 0)) && (
        <Separator />
      )}
      {visiblePlaylist && (
        <Item
          onClick={() => {
            dispatch(
              removeTracksFromPlaylist({
                playlistId: visiblePlaylist.id,
                itemIds: selectedTracks.map((track) => track.itemId)
              })
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
