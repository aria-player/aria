import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { selectSearch } from "../../features/search/searchSlice";
import styles from "./SearchResultsPage.module.css";
import { useTranslation } from "react-i18next";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { Outlet } from "react-router-dom";
import { selectVisibleSearchCategory } from "../../features/visibleSelectors";
import { useContext } from "react";
import { ScrollContext } from "../../contexts/ScrollContext";
import { SearchCategory } from "../../app/view";

export default function SearchResultsPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const { scrollY } = useContext(ScrollContext);
  const { onScroll } = useScrollDetection();

  return (
    <div className={styles.searchResults}>
      <div className={`${styles.tabs} ${scrollY <= 0 ? "" : styles.border}`}>
        <button
          className={`${styles.tab} ${
            visibleSearchCategory == null ? styles.selected : ""
          }`}
          onClick={() =>
            dispatch(push(BASEPATH + `search/${encodeURIComponent(search)}`))
          }
        >
          {t("search.categories.all")}
        </button>
        {Object.values(SearchCategory).map((category) => (
          <button
            key={category}
            className={`${styles.tab} ${
              visibleSearchCategory == category ? styles.selected : ""
            }`}
            onClick={() =>
              dispatch(
                push(
                  BASEPATH +
                    `search/${encodeURIComponent(search)}` +
                    `/${category}`
                )
              )
            }
          >
            {t(`search.categories.${category}.other`)}
          </button>
        ))}
      </div>

      <div
        className={styles.searchCategoryContainer}
        onScroll={(e) => onScroll(e.currentTarget.scrollTop)}
      >
        <Outlet />
      </div>
    </div>
  );
}
