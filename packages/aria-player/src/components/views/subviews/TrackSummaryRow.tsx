import { ICellRendererParams } from "@ag-grid-community/core";
import {
  formatStringArray,
  formatDuration,
  getRelativePath
} from "../../../app/utils";
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

import styles from "./TrackSummaryRow.module.css";
import { store } from "../../../app/store";
import {
  selectCurrentQueueTracks,
  selectCurrentTrack
} from "../../../features/currentSelectors";
import {
  selectVisiblePlaylist,
  selectVisibleViewType,
  selectVisibleTrackGrouping,
  selectVisibleSelectedTrackGroup,
  selectVisibleGroupFilteredTrackList,
  selectVisibleSearchTracks,
  selectVisibleArtistTracks
} from "../../../features/visibleSelectors";
import { getSourceHandle } from "../../../features/plugins/pluginsSlice";
import { AlbumArt } from "./AlbumArt";
import {
  addToSearchHistory,
  selectSearch
} from "../../../features/search/searchSlice";
import { QueueListItem } from "../../pages/QueuePage";
import { useLocation } from "react-router-dom";

export const TrackSummaryRow = (props: ICellRendererParams) => {
  const { show: showCellContextMenu } = useContextMenu({
    id: "tracklistitem"
  });
  const { setMenuData } = useContext(MenuContext);
  const dispatch = useAppDispatch();
  const location = useLocation();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const currentTrack = useAppSelector(selectCurrentTrack);
  const queueSource = useAppSelector(selectQueueSource);
  const visibleView = visiblePlaylist?.id ?? visibleViewType;
  const pluginHandle = getSourceHandle(props.data.source);

  props.registerRowDragger(
    props.eParentOfValue,
    undefined,
    props.data.name,
    true
  );

  const handleCellContextMenu = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
    rowProps: ICellRendererParams
  ) => {
    // Logic mostly duplicated from TrackList
    if (!rowProps.node.isSelected()) {
      rowProps.node.setSelected(true, true);
    }
    if (rowProps.node.id) {
      const visibleTracks =
        visibleView == View.Search
          ? selectVisibleSearchTracks(store.getState())
          : visibleView == View.Artist
            ? selectVisibleArtistTracks(store.getState())
            : visibleView == View.Queue
              ? (
                  selectCurrentQueueTracks(store.getState()) as QueueListItem[]
                ).filter((track) => !track.separator)
              : selectVisibleGroupFilteredTrackList(store.getState());
      setMenuData({
        itemId: rowProps.node.data.itemId,
        itemSource: getRelativePath(location.pathname),
        itemIndex:
          visibleTracks.findIndex(
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
    const state = store.getState();
    const queue = [] as PlaylistItem[];
    if (visibleView == View.Search) {
      selectVisibleSearchTracks(state).forEach((track) => {
        queue.push({
          itemId: track.itemId,
          trackId: track.trackId
        });
      });
    } else {
      props.api.forEachNodeAfterFilterAndSort((node) => {
        if (!node.data.separator) {
          queue.push({
            itemId: node.data.itemId,
            trackId: node.data.trackId
          });
        }
      });
    }
    if (visibleView == View.Queue) {
      dispatch(
        skipQueueIndexes(
          queue.findIndex((item) => rowProps.node.id == item.itemId)
        )
      );
      return;
    }

    const search = selectSearch(state);
    if (visibleView == View.Search) {
      dispatch(addToSearchHistory(search));
    }
    dispatch(
      setQueueToNewSource({
        queue,
        queueIndex:
          queue.findIndex((item) => rowProps.node.id == item.itemId) ?? 0,
        queueSource: getRelativePath(location.pathname),
        queueGrouping: selectVisibleTrackGrouping(state) ?? null,
        queueSelectedGroup: selectVisibleSelectedTrackGroup(state) ?? null
      })
    );
  };

  return (
    <div
      className={`track-summary-row ${styles.trackSummaryRow} ${
        props.data.itemId === currentTrack?.itemId &&
        (visibleView == View.Queue ||
          queueSource == getRelativePath(location.pathname))
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
      {visibleView != View.Search && visibleView != View.Artist && (
        <span className={`track-summary-row-number ${styles.trackNumber}`}>
          {props.node.data.track}
        </span>
      )}
      {[View.Queue, View.Search, View.Artist].includes(
        visibleViewType as View
      ) && (
        <span className={`track-summary-row-artwork ${styles.trackArtwork}`}>
          <AlbumArt track={props.node.data} />
        </span>
      )}
      <div className={styles.trackInfo}>
        <span className={`track-summary-row-title ${styles.trackText}`}>
          {props.node.data.title}
        </span>
        <span
          className={`track-summary-row-artist ${styles.trackText} ${styles.trackArtist}`}
        >
          {formatStringArray(props.node.data.artist)}
        </span>
      </div>
      {[View.Queue, View.Search, View.Artist].includes(
        visibleViewType as View
      ) &&
        pluginHandle?.Attribution && (
          <pluginHandle.Attribution
            type="track"
            id={props.data.uri}
            compact={true}
          />
        )}
      <span className={`track-summary-row-duration ${styles.trackDuration}`}>
        {props.node.data.duration == undefined
          ? "-"
          : formatDuration(props.node.data.duration)}
      </span>
    </div>
  );
};
