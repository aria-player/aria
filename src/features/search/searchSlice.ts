import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";

interface SearchState {
  search: string;
}

const initialState: SearchState = {
  search: ""
};

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    setSearch: (state, action) => {
      state.search = action.payload;
    }
  }
});

export const { setSearch } = searchSlice.actions;

export const selectSearch = (state: RootState) => state.search.search;

export default searchSlice.reducer;
