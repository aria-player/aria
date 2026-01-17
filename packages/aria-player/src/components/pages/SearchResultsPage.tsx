import { useAppSelector, useAppDispatch } from "../../app/hooks";
import { selectSearch } from "../../features/search/searchSlice";
import styles from "./SearchResultsPage.module.css";
import { useTranslation } from "react-i18next";
import { push } from "redux-first-history";
import { BASEPATH } from "../../app/constants";
import { useScrollDetection } from "../../hooks/useScrollDetection";
import { Outlet } from "react-router-dom";
import {
  selectVisibleSearchCategory,
  selectVisibleSearchSource
} from "../../features/visibleSelectors";
import { useContext } from "react";
import { ScrollContext } from "../../contexts/ScrollContext";
import { SearchCategory } from "../../app/view";
import SearchSourceSwitcher from "./search/SearchSourceSwitcher";

export default function SearchResultsPage() {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();
  const search = useAppSelector(selectSearch);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleSearchSource = useAppSelector(selectVisibleSearchSource);
  const { scrollY } = useContext(ScrollContext);
  const { onScroll } = useScrollDetection();

  const getSearchPath = (category?: string) => {
    const basePath = `search/${encodeURIComponent(search)}/${encodeURIComponent(visibleSearchSource ?? "library")}`;
    return BASEPATH + basePath + (category ? `/${category}` : "");
  };

  return (
    <div className={styles.searchResults}>
      <div className={`${styles.tabs} ${scrollY <= 0 ? "" : styles.border}`}>
        <div className={styles.categoryTabs}>
          <button
            className={`${styles.tab} ${
              visibleSearchCategory == null ? styles.selected : ""
            }`}
            onClick={() => dispatch(push(getSearchPath()))}
          >
            {t("search.categories.all")}
          </button>
          {Object.values(SearchCategory).map((category) => (
            <button
              key={category}
              className={`${styles.tab} ${
                visibleSearchCategory == category ? styles.selected : ""
              }`}
              onClick={() => dispatch(push(getSearchPath(category)))}
            >
              {t(`search.categories.${category}.other`)}
            </button>
          ))}
        </div>
        <SearchSourceSwitcher />
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
