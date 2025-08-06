import { Allotment } from "allotment";
import { useAppDispatch, useAppSelector } from "../../app/hooks";

import styles from "./SplitView.module.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
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
import { compareMetadata } from "../../app/sort";
import { push, replace } from "redux-first-history";
import { BASEPATH } from "../../app/constants";

export function SplitView() {
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [lastVisibleView, setLastVisibleView] = useState<string>("");
  const visibleItems = useAppSelector(selectVisibleTrackGroups).sort((a, b) =>
    compareMetadata(a, b)
  );
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylistSplitViewSizes = useAppSelector(
    selectVisiblePlaylistConfig
  )?.splitViewState.paneSizes;
  const visibleLibrarySplitViewConfig = useAppSelector(
    selectLibrarySplitViewStates
  )[visibleViewType];
  const visibleLibrarySplitViewSizes = visibleLibrarySplitViewConfig?.paneSizes;
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const splitViewStates = useAppSelector(selectLibrarySplitViewStates);
  const visiblePlaylistConfig = useAppSelector(selectVisiblePlaylistConfig);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (
      visiblePlaylist?.id &&
      visiblePlaylistConfig?.splitViewState.selectedGroup != selectedItem
    ) {
      dispatch(
        updatePlaylistSplitViewState({
          playlistId: visiblePlaylist?.id,
          splitState: { selectedGroup: selectedItem }
        })
      );
    } else if (visibleLibrarySplitViewConfig?.selectedGroup != selectedItem) {
      dispatch(
        updateLibrarySplitState({
          view: visibleViewType,
          splitState: { selectedGroup: selectedItem }
        })
      );
    }
    if (selectedItem && visibleItems.includes(selectedItem)) {
      return;
    }
    const lastSelectedGroup = visiblePlaylist?.id
      ? visiblePlaylistConfig?.splitViewState.selectedGroup
      : splitViewStates[visibleViewType]?.selectedGroup;
    const selectedGroup =
      lastSelectedGroup && visibleItems.includes(lastSelectedGroup)
        ? lastSelectedGroup
        : visibleItems[0];

    if (selectedGroup !== null && selectedGroup != undefined) {
      const path = visiblePlaylist?.id
        ? `playlist/${visiblePlaylist.id}/${encodeURIComponent(selectedGroup)}`
        : `${visibleViewType}/${encodeURIComponent(selectedGroup)}`;
      dispatch(replace(BASEPATH + path));
    }
  }, [
    dispatch,
    visibleViewType,
    splitViewStates,
    visibleItems,
    selectedItem,
    visiblePlaylistConfig,
    visibleLibrarySplitViewConfig?.selectedGroup,
    visiblePlaylist
  ]);

  const setSelectedItem = useCallback(
    (group: string | null) => {
      if (visiblePlaylist?.id) {
        dispatch(
          push(
            BASEPATH +
              `playlist/${visiblePlaylist.id}/${group != null ? encodeURIComponent(group) : ""}`
          )
        );
      } else {
        dispatch(
          push(
            BASEPATH +
              `${visibleViewType}/${group != null ? encodeURIComponent(group) : ""}`
          )
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
    <button
      key={itemName ?? index}
      ref={(el) => (itemRefs.current[itemName ?? index] = el)}
      className={`split-view-track-groups-item ${styles.listItem} ${selectedItem == itemName ? styles.selected : ""}`}
      onClick={() => {
        setSelectedItem(itemName ?? null);
      }}
    >
      {itemName}
    </button>
  ));

  useEffect(() => {
    const currentView = visiblePlaylist?.id || visibleViewType;
    if (lastVisibleView !== currentView) {
      setLastVisibleView(currentView);
      if (selectedItem && itemRefs.current[selectedItem]) {
        itemRefs.current[selectedItem]?.scrollIntoView({
          block: "center"
        });
      }
    }
  }, [
    visibleViewType,
    visiblePlaylist?.id,
    selectedItem,
    lastVisibleView,
    setLastVisibleView
  ]);

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
          <div className={`split-view-track-groups ${styles.trackGroupsList}`}>
            {buttons}
          </div>
        </Allotment.Pane>
        <Allotment.Pane minSize={600}>
          <div
            className={`split-view-album-track-list ${styles.albumTrackList}`}
          >
            <AlbumTrackList />
          </div>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
