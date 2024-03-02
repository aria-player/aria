import { ICellRendererParams } from "@ag-grid-community/core";
import { formatDuration } from "../../../app/utils";
import { useContextMenu } from "react-contexify";
import { useContext } from "react";
import { View } from "../../../app/view";
import { MenuContext } from "../../../contexts/MenuContext";
import {
  skipQueueIndexes,
  setQueueToNewSource,
  selectQueueSource
} from "../../../features/player/playerSlice";
import { PlaylistItem } from "../../../features/playlists/playlistsTypes";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectCurrentTrack,
  selectVisiblePlaylist,
  selectVisibleViewType
} from "../../../features/sharedSelectors";
import styles from "./AlbumTrackListRow.module.css";

export const AlbumTrackListRow = (props: ICellRendererParams) => {
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem"
  });
  const { setMenuData } = useContext(MenuContext);
  const dispatch = useAppDispatch();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const queueSource = useAppSelector(selectQueueSource);
  const currentTrack = useAppSelector(selectCurrentTrack);
  const visibleView = visiblePlaylist?.id ?? visibleViewType;

  props.registerRowDragger(
    props.eParentOfValue,
    undefined,
    props.data.name,
    true
  );

  // Logic mostly duplicated from TrackList
  const handleCellContextMenu = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowProps: ICellRendererParams
  ) => {
    if (!rowProps.node.isSelected()) {
      rowProps.node.setSelected(true, true);
    }
    if (rowProps.node.id) {
      setMenuData({
        itemId: rowProps.node.data.trackId,
        itemSource: visibleView,
        itemIndex:
          visiblePlaylist?.tracks.findIndex(
            (track) => track.itemId == rowProps.node.data.itemId
          ) ?? undefined,
        metadata: rowProps.node.data,
        type: "tracklistitem"
      });
    }
    showCellContextMenu({ event });
  };

  const handleCellDoubleClicked = (
    _: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowProps: ICellRendererParams
  ) => {
    if (visibleView == View.Queue) {
      dispatch(skipQueueIndexes(rowProps.node.rowIndex));
      return;
    }
    // We could use selectSortedTrackList here instead,
    // but then we'd be re-calculating the same sorted tracks that are already displayed
    const queue = [] as PlaylistItem[];
    props.api.forEachNodeAfterFilterAndSort((node) => {
      queue.push({
        itemId: node.data.itemId,
        trackId: node.data.trackId
      });
    });
    dispatch(
      setQueueToNewSource({
        queue,
        queueIndex: rowProps.node.rowIndex ?? 0,
        queueSource: visibleView
      })
    );
  };
  // End duplicated functions

  return (
    <div
      className={`${styles.trackDetailRow} ${
        props.data.itemId === currentTrack?.itemId && queueSource == visibleView
          ? styles.highlighted
          : ""
      }`}
      onContextMenu={(e) => {
        handleCellContextMenu(e, props);
      }}
      onDoubleClick={(e) => {
        handleCellDoubleClicked(e, props);
      }}
    >
      <span className={styles.trackNumber}>{props.node.data.track}</span>
      <div className={styles.trackInfo}>
        <div>
          <span>{props.node.data.title}</span>
          <br />
          <span className={styles.trackArtist}>
            {Array.isArray(props.node.data.artist)
              ? props.node.data.artist.join("/")
              : props.node.data.artist}
          </span>
        </div>
        <span className={styles.trackDuration}>
          {formatDuration(props.node.data.duration)}
        </span>
      </div>
    </div>
  );
};