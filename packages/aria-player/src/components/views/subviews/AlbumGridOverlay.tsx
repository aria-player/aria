import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { push } from "redux-first-history";
import { BASEPATH } from "../../../app/constants";
import { useAppDispatch, useAppSelector } from "../../../app/hooks";
import {
  selectVisiblePlaylist,
  selectVisibleSelectedTrackGroup,
  selectVisibleAlbums,
  selectVisibleViewType,
} from "../../../features/visibleSelectors";
import { AlbumTrackList } from "./AlbumTrackList";
import ChevronLeftIcon from "../../../assets/chevron-left-solid.svg?react";
import styles from "./AlbumGridOverlay.module.css";
import { GridContext } from "../../../contexts/GridContext";
import { DialogRoot, DialogBackdrop, DialogTitle } from "soprano-ui";
import { View } from "../../../app/view";
import type { AlbumOverlayTransitionDetails } from "./AlbumGridItem";

const DEFAULT_ORIGIN = { x: "50%", y: "50%" };

const CLOSE_ANIMATION_DURATION = 100;

export default function AlbumGridOverlay({
  transitionDetails,
  onTransitionConsumed,
}: {
  transitionDetails?: AlbumOverlayTransitionDetails | null;
  onTransitionConsumed?: () => void;
}) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const { isGridReady } = useContext(GridContext);
  const [scrollY, setScrollY] = useState(0);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleAlbums = useAppSelector(selectVisibleAlbums);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleAlbum = visibleAlbums.find((a) => a.albumId === selectedItem);
  const open = !!selectedItem && visibleViewType !== View.Artist;
  const [albumCache, setAlbumCache] = useState(visibleAlbum);
  if (visibleAlbum && visibleAlbum !== albumCache) setAlbumCache(visibleAlbum);
  const displayAlbum = visibleAlbum ?? albumCache;
  const [origin, setOrigin] = useState(DEFAULT_ORIGIN);
  const transitionMatchesSelection =
    transitionDetails != null && transitionDetails.albumId === selectedItem;
  if (
    transitionMatchesSelection &&
    (origin.x !== transitionDetails.origin.x ||
      origin.y !== transitionDetails.origin.y)
  ) {
    setOrigin(transitionDetails.origin);
  }

  useEffect(() => {
    if (transitionMatchesSelection) onTransitionConsumed?.();
  }, [transitionMatchesSelection, onTransitionConsumed]);

  useEffect(() => {
    if (!open) {
      const tid = setTimeout(() => {
        setOrigin(DEFAULT_ORIGIN);
      }, CLOSE_ANIMATION_DURATION);
      return () => clearTimeout(tid);
    }
  }, [open]);

  function closeOverlay() {
    const path = visiblePlaylist?.id
      ? `playlist/${visiblePlaylist?.id}`
      : "albums";
    dispatch(push(BASEPATH + path));
  }

  return (
    <DialogRoot
      open={open}
      onOpenChange={(isOpen) => !isOpen && closeOverlay()}
    >
      <DialogBackdrop
        className={`album-grid-overlay-background ${styles.overlay}`}
        aria-label={displayAlbum?.name ?? t("labels.album")}
        aria-describedby={undefined}
      >
        <div
          className={`album-grid-overlay-foreground ${styles.content}`}
          style={
            {
              "--origin-x": origin.x,
              "--origin-y": origin.y,
            } as React.CSSProperties
          }
          data-state={open ? "open" : "closed"}
        >
          <div
            className={`album-grid-overlay-header ${styles.header} ${
              scrollY <= 0 ? "" : styles.border
            }`}
          >
            <button
              title={t("labels.back")}
              className={styles.backButton}
              onClick={closeOverlay}
            >
              <ChevronLeftIcon />
            </button>
            <DialogTitle
              className={styles.title}
              style={{
                visibility: scrollY <= 0 || !isGridReady ? "hidden" : "visible",
              }}
            >
              {displayAlbum?.name}
            </DialogTitle>
          </div>
          <div
            className={`album-grid-album-track-list ag-overrides-album-view ${styles.albumTrackList}`}
          >
            <AlbumTrackList
              onBodyScroll={(e) => {
                setScrollY(e.top);
              }}
            />
          </div>
        </div>
      </DialogBackdrop>
    </DialogRoot>
  );
}
