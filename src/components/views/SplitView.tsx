import { Allotment } from "allotment";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import styles from "./SplitView.module.css";
import { useCallback, useEffect, useRef } from "react";
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
import { useLocation } from "react-router-dom";
import { store } from "../../app/store";

export function SplitView() {
  const location = useLocation();
  const itemRefs = useRef<Record<string, HTMLLIElement | null>>({});
  const visibleItems = useAppSelector(selectVisibleTrackGroups).sort((a, b) =>
    compareMetadata(a, b)
  );
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

  const setSelectedItem = useCallback(
    (group: string | null) => {
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
    },
    [dispatch, visiblePlaylist?.id, visibleViewType]
  );

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

  const buttons = visibleItems.map((itemName, index) => (
    <li
      key={itemName ?? index}
      ref={(el) => (itemRefs.current[itemName ?? index] = el)}
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

  useEffect(() => {
    if (
      (!selectedItem || !visibleItems.includes(selectedItem)) &&
      visibleItems[0]
    ) {
      setSelectedItem(visibleItems[0]);
    }
  }, [selectedItem, setSelectedItem, visibleItems]);

  useEffect(() => {
    const selectedItem = selectVisibleSelectedTrackGroup(store.getState());
    if (selectedItem && itemRefs.current[selectedItem]) {
      itemRefs.current[selectedItem]?.scrollIntoView({
        block: "center"
      });
    }
  }, [location]);

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
