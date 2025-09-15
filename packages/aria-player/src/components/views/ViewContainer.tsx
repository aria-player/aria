import { useAppSelector } from "../../app/hooks";
import { DisplayMode, SearchCategory, View } from "../../app/view";
import AlbumGrid from "./AlbumGrid";
import { TrackList } from "./TrackList";
import { SplitView } from "./SplitView";
import {
  selectVisibleDisplayMode,
  selectVisiblePlaylist,
  selectVisibleSearchCategory,
  selectVisibleViewType
} from "../../features/visibleSelectors";
import ArtistGrid from "./ArtistGrid";
import ErrorPage from "../pages/ErrorPage";

export default function ViewContainer() {
  const visibleDisplayMode = useAppSelector(selectVisibleDisplayMode);
  const visibleSearchCategory = useAppSelector(selectVisibleSearchCategory);
  const visibleViewType = useAppSelector(selectVisibleViewType);
  const visiblePlaylist = useAppSelector(selectVisiblePlaylist);

  return (
    <>
      {visibleViewType == View.Playlist && visiblePlaylist == null && (
        <ErrorPage />
      )}
      {visibleDisplayMode == DisplayMode.TrackList && (
        <div style={{ height: "100%", width: "100%" }}>
          <TrackList />
        </div>
      )}
      {visibleDisplayMode == DisplayMode.AlbumGrid && (
        <div
          style={{
            height: "100%",
            width: "100%",
            overflow: "auto"
          }}
        >
          <AlbumGrid />
        </div>
      )}
      {visibleDisplayMode == DisplayMode.SplitView && <SplitView />}
      {visibleSearchCategory == SearchCategory.Artists && <ArtistGrid />}
    </>
  );
}
