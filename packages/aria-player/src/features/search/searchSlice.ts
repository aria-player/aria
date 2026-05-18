import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { SearchCategory } from "../../app/view";

interface SearchState {
  search: string;
  debouncedSearch: string;
  searchHistory: string[];
  selectedSearchSource: string | null;
  selectedSearchCategory: SearchCategory | null;
}

const initialState: SearchState = {
  search: "",
  debouncedSearch: "",
  searchHistory: [],
  selectedSearchSource: null,
  selectedSearchCategory: null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
      if (!action.payload.trim()) {
        state.selectedSearchCategory = null;
      }
    },
    setDebouncedSearch: (state, action) => {
      state.debouncedSearch = action.payload;
    },
    addToSearchHistory: (state, action) => {
      state.searchHistory = state.searchHistory.filter(
        (item) => item !== action.payload
      );
      state.searchHistory.unshift(action.payload);
    },
    removeFromSearchHistory: (state, action) => {
      state.searchHistory = state.searchHistory.filter(
        (item) => item !== action.payload
      );
    },
    setSelectedSearchSource: (state, action) => {
      state.selectedSearchSource =
        action.payload === "library" ? null : action.payload;
    },
    setSelectedSearchCategory: (state, action) => {
      state.selectedSearchCategory = action.payload;
    },
  },
});

export const {
  setSearch,
  setDebouncedSearch,
  addToSearchHistory,
  removeFromSearchHistory,
  setSelectedSearchSource,
  setSelectedSearchCategory,
} = searchSlice.actions;

export const selectSearch = (state: RootState) => state.search.search;
export const selectDebouncedSearch = (state: RootState) =>
  state.search.debouncedSearch;
export const selectSearchHistory = (state: RootState) =>
  state.search.searchHistory;
export const selectSelectedSearchSource = (state: RootState) =>
  state.search.selectedSearchSource === "library"
    ? null
    : state.search.selectedSearchSource;
export const selectSelectedSearchCategory = (state: RootState) =>
  state.search.selectedSearchCategory;

export default searchSlice.reducer;

import { setupSearchListeners } from "./searchListeners";
setupSearchListeners();
