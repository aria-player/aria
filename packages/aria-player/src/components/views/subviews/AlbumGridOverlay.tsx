import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import { selectVisiblePlaylist } from "../../../features/visibleSelectors";
import { AlbumTrackList } from "./AlbumTrackList";
import LeftArrow from "../../../assets/arrow-left-solid.svg?react";
import styles from "./AlbumGridOverlay.module.css";

export default function AlbumGridOverlay() {
  const dispatch = useAppDispatch();
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);

  function closeOverlay() {
    const path = visiblePlaylist?.id
      ? `playlist/${visiblePlaylist?.id}`
      : "albums";
    dispatch(push(BASEPATH + path));
  }

  return (
    <div
      className={`album-grid-overlay-background ${styles.detailOuter}`}
      onClick={(e) => {
        if (e.currentTarget === e.target) {
          closeOverlay();
        }
      }}
    >
      <div className={`album-grid-overlay-foreground ${styles.detailInner}`}>
        <button
          className={`album-grid-overlay-back-button ${styles.backButton}`}
          onClick={() => {
            closeOverlay();
          }}
        >
          <LeftArrow />
        </button>
        <div className={`album-grid-album-track-list ${styles.albumTrackList}`}>
          <AlbumTrackList />
        </div>
      </div>
    </div>
  );
}
