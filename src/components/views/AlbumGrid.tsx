import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { selectAllTracks } from "../../features/tracks/tracksSlice";
import { AlbumArt } from "./subviews/AlbumArt";
import styles from "./AlbumGrid.module.css";
import LeftArrow from "../../assets/arrow-left-solid.svg?react";
import { DisplayMode } from "../../app/view";
import { AlbumTrackList } from "./subviews/AlbumTrackList";
import { useTranslation } from "react-i18next";
import { setSelectedAlbum } from "../../features/library/librarySlice";
import { setPlaylistSelectedTrackGroup } from "../../features/playlists/playlistsSlice";
import {
  selectVisiblePlaylist,
  selectVisibleSelectedTrackGroup,
  selectVisibleDisplayMode,
  selectVisibleTrackGroups
} from "../../features/visibleSelectors";
import { useRef } from "react";
import { getMostCommonArtworkUri, getScrollbarWidth } from "../../app/utils";
import { getSourceHandle } from "../../features/plugins/pluginsSlice";
import { FixedSizeGrid, GridChildComponentProps } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

type AlbumGridItemProps = GridChildComponentProps & {
  index: number;
};

export default function AlbumGrid() {
  const dispatch = useAppDispatch();

  const fixedSizeGridRef = useRef<FixedSizeGrid>(null);
  const { t } = useTranslation();
  const libraryTracks = useAppSelector(selectAllTracks);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);
  const selectedItem = useAppSelector(selectVisibleSelectedTrackGroup);
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleTrackGroups = useAppSelector(selectVisibleTrackGroups);
  const visibleAlbums = [
    ...new Map(
      libraryTracks
        .filter((track) => track.albumId && track.album)
        .map((track) => [track.albumId, track])
    ).values()
  ]
    .filter((track) => visibleTrackGroups.includes(track.albumId))
    .sort(
      (a, b) =>
        a.album?.localeCompare(b.album!, undefined, {
          sensitivity: "base",
          ignorePunctuation: true
        }) ?? 0
    );

  function setSelectedItem(albumId?: string) {
    if (visiblePlaylist?.id) {
      dispatch(
        setPlaylistSelectedTrackGroup({
          playlistId: visiblePlaylist?.id,
          selectedGroup: albumId ?? null
        })
      );
    } else {
      dispatch(setSelectedAlbum(albumId ?? null));
    }
  }

  const itemRenderer = ({ index, style }: AlbumGridItemProps) => {
    if (index >= visibleAlbums.length) return null;
    const track = visibleAlbums[index];
    const pluginHandle = getSourceHandle(track.source);
    return (
      <div key={track.albumId ?? index} style={style}>
        <div className={`album-grid-item ${styles.gridItem}`}>
          <button
            className={styles.albumArt}
            onClick={() => setSelectedItem(track.albumId)}
            disabled={
              selectedItem || visibleDisplayMode !== DisplayMode.AlbumGrid
                ? true
                : false
            }
          >
            <AlbumArt
              track={{
                ...track,
                artworkUri: getMostCommonArtworkUri(
                  libraryTracks.filter((t) => t.albumId === track.albumId)
                )
              }}
            />
          </button>
          <div className={styles.albumInfo}>
            <div className={styles.albumTextContainer}>
              <div className={`${styles.albumText} ${styles.albumTitle}`}>
                {track.album}
              </div>
              <div className={`${styles.albumText} ${styles.albumArtist}`}>
                {track.albumArtist ?? track.artist}
              </div>
            </div>
            {track.albumId && pluginHandle?.Attribution && (
              <pluginHandle.Attribution
                type="album"
                id={track.albumId}
                compact={true}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`album-grid ${styles.grid}`}>
      {visibleAlbums.length > 0 ? (
        <AutoSizer>
          {({ height, width }) => {
            const widthWithoutScrollbar = width - (getScrollbarWidth() ?? 0);
            const minItemWidth = 240;
            const columnCount = Math.max(
              1,
              Math.floor(widthWithoutScrollbar / minItemWidth)
            );
            const columnWidth = widthWithoutScrollbar / columnCount;
            const rowHeight = columnWidth + 40;
            const rowCount = Math.ceil(visibleAlbums.length / columnCount);
            const selectedIndex = visibleAlbums.findIndex(
              (album) => album.albumId === selectedItem
            );
            const initialRowIndex =
              selectedIndex >= 0 ? Math.floor(selectedIndex / columnCount) : 0;
            const initialScrollTop =
              initialRowIndex * rowHeight - height / 2 + rowHeight / 2;

            return (
              <FixedSizeGrid
                ref={fixedSizeGridRef}
                width={width}
                height={height}
                rowCount={rowCount}
                columnCount={columnCount}
                columnWidth={columnWidth}
                rowHeight={rowHeight}
                initialScrollTop={initialScrollTop}
                style={{ overflowX: "hidden" }}
              >
                {({ columnIndex, rowIndex, style, data }) =>
                  itemRenderer({
                    columnIndex,
                    rowIndex,
                    style,
                    data,
                    index: rowIndex * columnCount + columnIndex
                  })
                }
              </FixedSizeGrid>
            );
          }}
        </AutoSizer>
      ) : (
        <div className={styles.empty}>{t("albumGrid.empty")}</div>
      )}
      {selectedItem && (
        <div
          className={`album-grid-overlay-background ${styles.detailOuter}`}
          onClick={(e) => {
            if (e.currentTarget === e.target) {
              setSelectedItem();
            }
          }}
        >
          <div
            className={`album-grid-overlay-foreground ${styles.detailInner}`}
          >
            <button
              className={`album-grid-overlay-back-button ${styles.backButton}`}
              onClick={() => {
                setSelectedItem();
              }}
            >
              <LeftArrow />
            </button>
            <div
              className={`album-grid-album-track-list ${styles.albumTrackList}`}
            >
              <AlbumTrackList />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
