import { listenForChange } from "../../app/listener";
import { invalidateSearchCache } from "../../app/search";
import { selectArtistDelimiter } from "../config/configSlice";

export function setupSearchListeners() {
  listenForChange(
    (state) => [
      selectArtistDelimiter(state),
      state.tracks.tracks,
      state.artists.artists,
      state.albums.albums,
    ],
    () => {
      invalidateSearchCache();
    }
  );
}
