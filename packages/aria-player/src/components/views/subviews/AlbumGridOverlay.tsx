import { useState } from "react";
import { useTranslation } from "react-i18next";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectVisiblePlaylist,
  selectVisibleSelectedTrackGroup,
  selectVisibleAlbums
} from "../../../features/visibleSelectors";
import { useTrackGrid } from "../../../hooks/useTrackGrid";
import { AlbumTrackList } from "./AlbumTrackList";
import ChevronLeftIcon from "../../../assets/chevron-left-solid.svg?react";
import styles from "./AlbumGridOverlay.module.css";

export default function AlbumGrid() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { gridRef } = useTrackGrid();
  const [scrollY, setScrollY] = useState(0);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleAlbums = useAppSelector(selectVisibleAlbums);
  const visibleAlbum = visibleAlbums.find((a) => a.albumId === selectedItem);

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
        <div
          className={`album-grid-overlay-header ${styles.detailHeader} ${
            scrollY <= 0 ? "" : styles.border
          }`}
        >
          <button
            title={t("labels.back")}
            className={styles.backButton}
            onClick={() => {
              closeOverlay();
            }}
          >
            <ChevronLeftIcon />
          </button>
          <h2
            style={{
              visibility:
                scrollY <= 0 || !gridRef?.current?.api ? "hidden" : "visible"
            }}
          >
            {visibleAlbum?.name}
          </h2>
        </div>
        <div
          className={`album-grid-album-track-list  ag-overrides-album-view ${styles.albumTrackList}`}
        >
          <AlbumTrackList
            onBodyScroll={(e) => {
              setScrollY(e.top);
            }}
          />
        </div>
      </div>
    </div>
  );
}
