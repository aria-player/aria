import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Themes } from "../../app/themes";

export interface ConfigState {
  theme: string;
}

const initialState: ConfigState = {
  theme: Themes.System.id
};

export const configSlice = createSlice({
  name: "config",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<string>) => {
      state.theme = action.payload;
    }
  }
});

export const { setTheme } = configSlice.actions;

export const selectTheme = (state: RootState) => state.config.theme;

export default configSlice.reducer;
