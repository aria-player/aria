import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { DisplayMode, View } from "../../app/view";
import styles from "./Header.module.css";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import { useTranslation } from "react-i18next";
import { selectPlaylistsLayoutItemById } from "../../features/playlists/playlistsSlice";
import { selectSearch } from "../../features/search/searchSlice";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import ChevronRightIcon from "../../assets/chevron-right-solid.svg?react";

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

  return (
    <header
      className={`header ${styles.header} ${visibleDisplayMode != DisplayMode.TrackList ? styles.border : ""}`}
    >
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
          <h1>{t(`search.categories.${visibleSearchCategory}`)}</h1>
        </div>
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
