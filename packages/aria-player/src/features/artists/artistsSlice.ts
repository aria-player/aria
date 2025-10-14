import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Artist, ArtistId } from "../../../../types/tracks";
import { PluginId } from "../../../../types/plugins";

const artistsAdapter = createEntityAdapter<Artist, ArtistId>({
  selectId: (artist) => artist.artistId,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

interface ArtistsState {
  artists: EntityState<Artist, ArtistId>;
}

const initialState: ArtistsState = {
  artists: artistsAdapter.getInitialState()
};

const artistsSlice = createSlice({
  name: "artists",
  initialState,
  reducers: {
    addArtists: (
      state,
      action: PayloadAction<{ source: PluginId; artists: Artist[] }>
    ) => {
      artistsAdapter.upsertMany(state.artists, action.payload.artists);
    },
    removeArtists: (
      state,
      action: PayloadAction<{ source: PluginId; artists?: ArtistId[] }>
    ) => {
      const { artists, source } = action.payload;
      if (artists) {
        artistsAdapter.removeMany(state.artists, artists);
      } else {
        const artistsToRemove = state.artists.ids.filter(
          (id) => state.artists.entities[id]?.source === source
        );
        artistsAdapter.removeMany(state.artists, artistsToRemove);
      }
    }
  }
});

export const { addArtists, removeArtists } = artistsSlice.actions;

export const {
  selectById: selectArtistInfoById,
  selectEntities: selectArtistsInfo
} = artistsAdapter.getSelectors((state: RootState) => state.artists.artists);

export default artistsSlice.reducer;
