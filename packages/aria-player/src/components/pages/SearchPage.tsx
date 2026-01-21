import { useAppSelector, useAppDispatch } from "../../app/hooks";
import {
  selectSearchHistory,
  removeFromSearchHistory,
  selectSelectedSearchSource
} from "../../features/search/searchSlice";
import styles from "./SearchPage.module.css";
import ClearIcon from "../../assets/xmark-solid.svg?react";
import { useTranslation } from "react-i18next";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { useScrollDetection } from "../../hooks/useScrollDetection";

export default function SearchPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const searchHistory = useAppSelector(selectSearchHistory);
  const selectedSearchSource = useAppSelector(selectSelectedSearchSource);
  const { onScroll } = useScrollDetection();

  return (
    <div
      className={styles.search}
      onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
    >
      <div className={styles.container}>
        <>
          <h1 className={styles.title}>{t("search.landingTitle")}</h1>
          <p className={styles.subtitle}>{t("search.landingSubtitle")}</p>
        </>
        {searchHistory.length > 0 && (
          <div className={styles.historyPanel}>
            <h2 className={`search-history-header ${styles.historyHeader}`}>
              {t("search.recentSearches")}
            </h2>
            <ul className={`search-history-list ${styles.historyList}`}>
              {searchHistory.map((item, index) => (
                <li
                  key={index}
                  className={`search-history-item ${styles.historyItem}`}
                >
                  <button
                    onClick={() => {
                      dispatch(
                        push(
                          BASEPATH +
                            "search/" +
                            encodeURIComponent(item) +
                            "/" +
                            encodeURIComponent(
                              selectedSearchSource ?? "library"
                            )
                        )
                      );
                    }}
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
          </div>
        )}
      </div>
    </div>
  );
}
