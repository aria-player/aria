import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

interface SearchState {
  search: string;
  searchHistory: string[];
}

const initialState: SearchState = {
  search: "",
  searchHistory: []
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
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
    }
  }
});

export const { setSearch, addToSearchHistory, removeFromSearchHistory } =
  searchSlice.actions;

export const selectSearch = (state: RootState) => state.search.search;
export const selectSearchHistory = (state: RootState) =>
  state.search.searchHistory;

export default searchSlice.reducer;
