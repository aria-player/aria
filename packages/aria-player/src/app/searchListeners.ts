import { listenForChange } from "./listener";
import { invalidateSearchCache } from "./search";
import { selectArtistDelimiter } from "../features/config/configSlice";

export function setupSearchListeners() {
  listenForChange(
    (state) => [
      selectArtistDelimiter(state),
      state.tracks.tracks,
      state.artists.artists,
      state.albums.albums
    ],
    () => {
      invalidateSearchCache();
    }
  );
}
