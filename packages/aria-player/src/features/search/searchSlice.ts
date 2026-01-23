import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

interface SearchState {
  search: string;
  debouncedSearch: string;
  searchHistory: string[];
  selectedSearchSource: string | null;
}

const initialState: SearchState = {
  search: "",
  debouncedSearch: "",
  searchHistory: [],
  selectedSearchSource: null
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
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
      state.selectedSearchSource = action.payload;
    }
  }
});

export const {
  setSearch,
  setDebouncedSearch,
  addToSearchHistory,
  removeFromSearchHistory,
  setSelectedSearchSource
} = searchSlice.actions;

export const selectSearch = (state: RootState) => state.search.search;
export const selectDebouncedSearch = (state: RootState) =>
  state.search.debouncedSearch;
export const selectSearchHistory = (state: RootState) =>
  state.search.searchHistory;
export const selectSelectedSearchSource = (state: RootState) =>
  state.search.selectedSearchSource;

export default searchSlice.reducer;

import { setupSearchListeners } from "../../app/searchListeners";
setupSearchListeners();
