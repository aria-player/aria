import { Allotment } from "allotment";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  selectVisiblePlaylist,
  selectVisiblePlaylistConfig,
  selectVisibleSelectedTrackGroup,
  selectVisibleTrackGroups
} from "../../features/sharedSelectors";
import styles from "./SplitView.module.css";
import {
  setPlaylistSelectedTrackGroup,
  updatePlaylistSplitViewSizes
} from "../../features/playlists/playlistsSlice";
import { useCallback } from "react";
import { AlbumTrackList } from "./subviews/AlbumTrackList";

export function SplitView() {
  const visibleItems = useAppSelector(selectVisibleTrackGroups);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visiblePlaylistSplitViewSizes = useAppSelector(
    selectVisiblePlaylistConfig
  )?.splitViewSizes;
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const dispatch = useAppDispatch();

  function setSelectedItem(group: string | null) {
    if (visiblePlaylist?.id) {
      dispatch(
        setPlaylistSelectedTrackGroup({
          playlistId: visiblePlaylist?.id,
          selectedGroup: group
        })
      );
    }
  }

  const handleDragEnd = useCallback(
    (sizes: number[]) => {
      if (visiblePlaylist)
        dispatch(
          updatePlaylistSplitViewSizes({
            playlistId: visiblePlaylist?.id,
            splitSizes: sizes
          })
        );
    },
    [dispatch, visiblePlaylist]
  );

  const buttons = visibleItems.map((itemName, index) => (
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
        key={visiblePlaylist?.id}
        onDragEnd={handleDragEnd}
        defaultSizes={visiblePlaylistSplitViewSizes ?? [2, 8]}
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
