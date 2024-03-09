import { Allotment } from "allotment";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import styles from "./SplitView.module.css";
import { useCallback } from "react";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { compareMetadata } from "../../app/utils";
import {
  selectLibrarySplitViewStates,
  updateLibrarySplitState
} from "../../features/library/librarySlice";
import { updatePlaylistSplitViewState } from "../../features/playlists/playlistsSlice";
import {
  selectVisibleTrackGroups,
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisiblePlaylistConfig,
  selectVisibleSelectedTrackGroup
} from "../../features/visibleSelectors";

export function SplitView() {
  const visibleItems = useAppSelector(selectVisibleTrackGroups);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylistSplitViewSizes = useAppSelector(
    selectVisiblePlaylistConfig
  )?.splitViewState.paneSizes;
  const visibleLibrarySplitViewSizes = useAppSelector(
    selectLibrarySplitViewStates
  )[visibleViewType]?.paneSizes;
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const dispatch = useAppDispatch();

  function setSelectedItem(group: string | null) {
    if (visiblePlaylist?.id) {
      dispatch(
        updatePlaylistSplitViewState({
          playlistId: visiblePlaylist?.id,
          splitState: { selectedGroup: group }
        })
      );
    } else {
      dispatch(
        updateLibrarySplitState({
          view: visibleViewType,
          splitState: { selectedGroup: group }
        })
      );
    }
  }

  const handleDragEnd = useCallback(
    (sizes: number[]) => {
      if (visiblePlaylist) {
        dispatch(
          updatePlaylistSplitViewState({
            playlistId: visiblePlaylist?.id,
            splitState: { paneSizes: sizes }
          })
        );
      } else {
        dispatch(
          updateLibrarySplitState({
            view: visibleViewType,
            splitState: { paneSizes: sizes }
          })
        );
      }
    },
    [dispatch, visiblePlaylist, visibleViewType]
  );

  const buttons = visibleItems
    .sort((a, b) => compareMetadata(a, b))
    .map((itemName, index) => (
      <li
        key={itemName}
        className={`${styles.listItem} ${selectedItem == itemName ? styles.selected : ""}`}
      >
        <button
          key={index}
          onClick={() => {
            setSelectedItem(itemName ?? null);
          }}
        >
          {itemName}
        </button>
      </li>
    ));

  return (
    <div className={styles.splitView}>
      <Allotment
        key={visibleViewType + visiblePlaylist?.id}
        onDragEnd={handleDragEnd}
        defaultSizes={
          visiblePlaylistSplitViewSizes ??
          visibleLibrarySplitViewSizes ?? [2, 8]
        }
      >
        <Allotment.Pane minSize={60}>
          <ul className={styles.trackGroupsList}>{buttons}</ul>
        </Allotment.Pane>
        <Allotment.Pane minSize={600}>
          <div className={styles.albumTrackList}>
            <AlbumTrackList />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
