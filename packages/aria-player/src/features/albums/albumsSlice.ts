import {
  EntityState,
  PayloadAction,
  createEntityAdapter,
  createSlice
} from "@reduxjs/toolkit";
import { RootState } from "../../app/store";
import { Album, AlbumId, PluginId } from "../../../../types";

const albumsAdapter = createEntityAdapter<Album, AlbumId>({
  selectId: (album) => album.albumId,
  sortComparer: (a, b) => a.name.localeCompare(b.name)
});

interface AlbumsState {
  albums: EntityState<Album, AlbumId>;
}

const initialState: AlbumsState = {
  albums: albumsAdapter.getInitialState()
};

const albumsSlice = createSlice({
  name: "albums",
  initialState,
  reducers: {
    addAlbums: (
      state,
      action: PayloadAction<{ source: PluginId; albums: Album[] }>
    ) => {
      albumsAdapter.upsertMany(state.albums, action.payload.albums);
    },
    removeAlbums: (
      state,
      action: PayloadAction<{ source: PluginId; albums?: AlbumId[] }>
    ) => {
      const { albums, source } = action.payload;
      if (albums) {
        albumsAdapter.removeMany(state.albums, albums);
      } else {
        const albumsToRemove = state.albums.ids.filter(
          (id) => state.albums.entities[id]?.source === source
        );
        albumsAdapter.removeMany(state.albums, albumsToRemove);
      }
    }
  }
});

export const { addAlbums, removeAlbums } = albumsSlice.actions;

export const {
  selectById: selectAlbumInfoById,
  selectEntities: selectAlbumsInfo
} = albumsAdapter.getSelectors((state: RootState) => state.albums.albums);

export default albumsSlice.reducer;
