import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  selectSearch,
  selectSearchHistory,
  setSearch,
  removeFromSearchHistory
} from "../../features/search/searchSlice";
import styles from "./SearchPage.module.css";
import ClearIcon from "../../assets/xmark-solid.svg?react";
import { useTranslation } from "react-i18next";

export default function SearchPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const searchHistory = useAppSelector(selectSearchHistory);
  const search = useAppSelector(selectSearch);
  if (search !== "" || searchHistory.length == 0) return null;

  return (
    <>
      <h2 className={`search-history-header ${styles.historyHeader}`}>
        {t("search.previousSearches")}
      </h2>
      <ul className={`search-history-list ${styles.historyList}`}>
        {searchHistory.map((item, index) => (
          <li
            key={index}
            className={`search-history-item ${styles.historyItem}`}
          >
            <button
              onClick={() => dispatch(setSearch(item))}
              className={styles.searchLink}
            >
              {item}
            </button>
            <button
              className={styles.removeButton}
              title={t("search.remove")}
              onClick={() => dispatch(removeFromSearchHistory(item))}
            >
              <ClearIcon />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
