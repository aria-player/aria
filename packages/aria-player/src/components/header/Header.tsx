import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { DisplayMode, View } from "../../app/view";
import styles from "./Header.module.css";
import {
  selectVisibleArtist,
  selectVisibleArtistSection,
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSelectedTrackGroup,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import { useTranslation } from "react-i18next";
import { selectPlaylistsLayoutItemById } from "../../features/playlists/playlistsSlice";
import { selectSearch } from "../../features/search/searchSlice";
import { goBack, push } from "redux-first-history";
import ChevronLeftIcon from "../../assets/chevron-left-solid.svg?react";
import { ScrollContext } from "../../contexts/ScrollContext";
import { useContext } from "react";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { selectMenuState } from "../../app/menu";
import { BASEPATH } from "../../app/constants";
import { selectAllAlbums } from "../../features/genericSelectors";

export default function Header() {
  const dispatch = useAppDispatch();
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const { t } = useTranslation();
  const currentPlaylistId = useAppSelector(selectVisiblePlaylist)?.id;
  const playlistName = useAppSelector((state) =>
    selectPlaylistsLayoutItemById(state, currentPlaylistId ?? "")
  )?.name;
  const search = useAppSelector(selectSearch);
  const scrollContext = useContext(ScrollContext);
  const visibleSelectedTrackGroup = useAppSelector(
    selectVisibleSelectedTrackGroup
  );
  const visibleAlbum = useAppSelector(selectAllAlbums).find(
    (a) => a.albumId === visibleSelectedTrackGroup
  );
  const visibleArtist = useAppSelector(selectVisibleArtist);
  const visibleArtistSection = useAppSelector(selectVisibleArtistSection);
  const { gridRef } = useTrackGrid();
  const menuState = useAppSelector(selectMenuState);
  const backEnabled = !menuState.back?.disabled;

  return (
    <header
      className={`header ${styles.header} ${
        (visibleViewType == View.Search && search) ||
        visibleDisplayMode == DisplayMode.TrackList ||
        (visibleDisplayMode != DisplayMode.SplitView &&
          scrollContext?.scrollY <= 0)
          ? ""
          : styles.border
      }`}
    >
      {(visibleViewType == View.Album || visibleViewType == View.Artist) && (
        <button
          title={t("labels.back")}
          className={styles.backButton}
          disabled={!backEnabled}
          onClick={() => {
            if (backEnabled) dispatch(goBack());
          }}
        >
          <ChevronLeftIcon />
        </button>
      )}
      {visibleArtistSection != undefined ? (
        <button
          className={styles.headerLink}
          onClick={() => {
            if (visibleArtist) {
              dispatch(
                push(
                  BASEPATH +
                    "artist/" +
                    encodeURIComponent(visibleArtist?.artistId)
                )
              );
            }
          }}
        >
          <h1>{visibleArtist?.name}</h1>
        </button>
      ) : visibleViewType == View.Album || visibleViewType == View.Artist ? (
        <h1
          style={{
            visibility:
              visibleArtistSection != undefined
                ? "visible"
                : scrollContext?.scrollY <= 0 || !gridRef?.current?.api
                  ? "hidden"
                  : "visible"
          }}
        >
          {visibleAlbum?.name || visibleArtist?.name}
        </h1>
      ) : (
        <h1>
          {visibleViewType == View.Search
            ? search == ""
              ? t("views.search")
              : t("search.resultsFor", { search })
            : playlistName ||
              t(`views.${visibleViewType}`, {
                defaultValue: t("views.error")
              })}
        </h1>
      )}
    </header>
  );
}
