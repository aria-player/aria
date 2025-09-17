import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { DisplayMode, View } from "../../app/view";
import styles from "./Header.module.css";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleSelectedTrackGroup,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import { useTranslation } from "react-i18next";
import { selectPlaylistsLayoutItemById } from "../../features/playlists/playlistsSlice";
import { selectSearch } from "../../features/search/searchSlice";
import { goBack, push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import ChevronLeftIcon from "../../assets/chevron-left-solid.svg?react";
import ChevronRightIcon from "../../assets/chevron-right-solid.svg?react";
import { ScrollContext } from "../../contexts/ScrollContext";
import { useContext } from "react";
import { useTrackGrid } from "../../hooks/useTrackGrid";
import { selectMenuState } from "../../app/menu";
import { selectAllAlbums } from "../../features/tracks/tracksSlice";

export default function Header() {
  const dispatch = useAppDispatch();
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
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
  const { gridRef } = useTrackGrid();
  const menuState = useAppSelector(selectMenuState);
  const backEnabled = !menuState.back?.disabled;

  return (
    <header
      className={`header ${styles.header} ${
        visibleDisplayMode == DisplayMode.TrackList ||
        (visibleDisplayMode != DisplayMode.SplitView &&
          scrollContext?.scrollY <= 0)
          ? ""
          : styles.border
      }`}
    >
      {visibleViewType == View.Album && (
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
      {visibleSearchCategory ? (
        <div className={styles.breadcrumbContainer}>
          <button
            className={styles.breadcrumbLink}
            onClick={() =>
              dispatch(push(BASEPATH + `search/${encodeURIComponent(search)}`))
            }
            title={t("search.resultsFor", { search })}
          >
            {t("search.resultsFor", { search })}
          </button>
          <ChevronRightIcon className={styles.breadcrumbIcon} />
          <h1>{t(`search.categories.${visibleSearchCategory}.other`)}</h1>
        </div>
      ) : visibleViewType == View.Album ? (
        <h1
          style={{
            visibility:
              scrollContext?.scrollY <= 0 || !gridRef?.current?.api
                ? "hidden"
                : "visible"
          }}
        >
          {visibleAlbum?.album}
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
